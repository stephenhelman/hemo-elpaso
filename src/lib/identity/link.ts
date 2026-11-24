import { createHash } from "crypto";
import { AuditAction, type UserIdentity } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { sendLoggedEmail } from "@/lib/email/send";
import { getRouteRecipients } from "@/lib/email-routing";
import { siteUrl } from "@/lib/site";
import { decideLink, isOrgEmail, normalizeEmail, providerOf, type LinkCandidate } from "./rules";
import { emailDomain } from "@/lib/site";

export interface AuthUser {
  sub: string;
  email?: string | null;
  email_verified?: boolean | null;
}

const HOUR = 36e5;
const DAY = 24 * HOUR;

/** Same address, twice in 24h, must not email the officers twice. */
const noticeKey = (ids: string[]) => "dup:" + createHash("sha256").update(ids.join(",")).digest("hex").slice(0, 24);

/**
 * Called on every request that needs to know who someone is. Returns the identity row for this Auth0 `sub`,
 * linking it on first sight when the rules allow:
 *
 *   verified email matches exactly one Patient.email  -> linked (linkedVia "auto")
 *   zero matches                                      -> stored UNMATCHED (patientId null; purged after 30 days)
 *   two or more                                       -> stored unmatched + `board.duplicates` notice (a link only)
 *
 * Only the primary email is matched. HouseholdMember emails are never candidates: only the primary adult signs in.
 * Unmatched sign-ins are retried on every request, so a family that registers afterwards is linked on its next visit.
 */
export async function syncIdentity(user: AuthUser): Promise<UserIdentity | null> {
  if (!user.sub) return null;
  const now = new Date();
  const existing = await prisma.userIdentity.findUnique({ where: { auth0Sub: user.sub } });
  const email = normalizeEmail(user.email);
  const verified = user.email_verified === true;

  if (existing?.patientId) {
    // Keep what the provider says current (an org identity whose provider email changed stops being org), and note use.
    const stale = now.getTime() - existing.lastLoginAt.getTime() > HOUR;
    const changed = email && (existing.email !== email || existing.emailVerified !== verified);
    if (stale || changed) {
      return prisma.userIdentity.update({
        where: { id: existing.id },
        data: { lastLoginAt: now, ...(changed ? { email, emailVerified: verified } : {}) },
      });
    }
    return existing;
  }

  // Unlinked by a person with authority: stays unmatched until the President/VP links it again (never auto-relinked).
  if (existing?.linkedVia === "unlinked") {
    return now.getTime() - existing.lastLoginAt.getTime() > HOUR ? prisma.userIdentity.update({ where: { id: existing.id }, data: { lastLoginAt: now } }) : existing;
  }

  if (!email || !verified) return null; // the Auth0 Action already denies these; never link on an unverified email

  const candidates = await candidatesForEmail(email);
  const decision = decideLink(verified, candidates);
  const provider = providerOf(user.sub);

  if (decision.kind === "link") {
    const row = await prisma.userIdentity.upsert({
      where: { auth0Sub: user.sub },
      create: { auth0Sub: user.sub, provider, email, emailVerified: true, patientId: decision.patientId, householdMemberId: decision.memberId, linkedAt: now, linkedVia: "auto", lastLoginAt: now },
      update: { provider, email, emailVerified: true, patientId: decision.patientId, householdMemberId: decision.memberId, linkedAt: now, linkedVia: "auto", linkedByPatientId: null, lastLoginAt: now },
    });
    await audit({
      actorType: "system", action: AuditAction.IDENTITY_LINKED, resourceType: "UserIdentity", resourceId: row.id,
      details: "Sign-in linked automatically by verified email",
      changes: { patientId: decision.patientId, memberId: decision.memberId, provider, via: "auto" },
    });
    return row;
  }

  if (decision.kind === "unmatched" || decision.kind === "ambiguous") {
    const isNew = !existing;
    const row = await prisma.userIdentity.upsert({
      where: { auth0Sub: user.sub },
      create: { auth0Sub: user.sub, provider, email, emailVerified: true, lastLoginAt: now },
      update: now.getTime() - (existing?.lastLoginAt.getTime() ?? 0) > HOUR ? { email, emailVerified: true, lastLoginAt: now } : {},
    });
    if (isNew) {
      await audit({
        actorType: "system", action: AuditAction.IDENTITY_LINK_FAILED, resourceType: "UserIdentity", resourceId: row.id,
        details: decision.kind === "ambiguous" ? "Sign-in matched more than one household" : "Sign-in matched no household",
        changes: { provider, matches: decision.kind === "ambiguous" ? decision.patientIds.length : 0 },
      });
    }
    if (decision.kind === "ambiguous") await notifyDuplicates(decision.patientIds, row.id);
    return row;
  }
  return null;
}

/**
 * People a verified sign-in email may belong to: a primary email match, an alias (the address of a record that was merged
 * into this one), or a CONFIRMED ADULT member's email (never a pending, declined or minor member). Merged-away tombstones
 * never match. An org-domain address never matches a member, so a board member's org login stays unambiguous.
 */
export async function candidatesForEmail(email: string): Promise<LinkCandidate[]> {
  const e = email.trim().toLowerCase();
  const patients = await prisma.patient.findMany({
    where: { mergedIntoId: null, OR: [{ email: { equals: e, mode: "insensitive" } }, { emailAliases: { some: { email: e } } }] },
    select: { id: true },
  });
  const members = isOrgEmail(e, emailDomain())
    ? []
    : await prisma.householdMember.findMany({
        where: { email: { equals: e, mode: "insensitive" }, status: "confirmed", ageGroup: "18_plus", patient: { mergedIntoId: null } },
        select: { id: true, patientId: true },
      });
  return [...patients.map((p) => ({ id: p.id })), ...members.map((m) => ({ id: m.patientId, memberId: m.id }))];
}

/** At most one notice per matching set per 24h. The email holds a link only: no names, addresses or household details. */
async function notifyDuplicates(patientIds: string[], identityId: string): Promise<void> {
  try {
    const key = noticeKey(patientIds);
    const recent = await prisma.auditLog.count({
      where: { action: AuditAction.IDENTITY_LINK_FAILED, resourceType: "DuplicateNotice", resourceId: key, createdAt: { gte: new Date(Date.now() - DAY) } },
    });
    if (recent > 0) return;
    await audit({
      actorType: "system", action: AuditAction.IDENTITY_LINK_FAILED, resourceType: "DuplicateNotice", resourceId: key,
      details: "Officer notice for a sign-in that matched more than one household", changes: { identityId, matches: patientIds.length },
    });
    const link = `${siteUrl()}/admin/identities`;
    await sendLoggedEmail({
      kind: "DUPLICATE_SIGNIN_NOTICE", sender: "noreply", to: await getRouteRecipients("board.duplicates"),
      subject: "A sign-in needs review / Un inicio de sesión necesita revisión",
      html:
        `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:560px">` +
        `<p>Someone signed in and could not be matched to a single household. Please review it here: <a href="${link}">${link}</a></p><hr/>` +
        `<p>Alguien inició sesión y no se pudo asociar a un solo hogar. Revíselo aquí: <a href="${link}">${link}</a></p></div>`,
    });
  } catch {
    console.error("duplicate sign-in notice failed");
  }
}
