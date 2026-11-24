import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CONSENT_TEXT_VERSION } from "@/content/consent";
import { cleanText, isValidEmail, normalizeEmail, normalizePhone } from "@/lib/patients/normalize";
import { sanitizeDiagnoses } from "@/lib/patients/diagnoses";
import { validateMembers } from "@/lib/households/members";
import { AGE_GROUPS, CONFIRM_TOKEN_DAYS, MAX_HOUSEHOLD_SIZE, RELATIONSHIPS } from "@/lib/households/constants";
import { purgedMemberData, recomputeHousehold } from "@/lib/households/sync";
import { sendMemberConfirmation } from "@/lib/households/confirmation";
import { dropMemberFromRsvps } from "@/lib/rsvp/attendees";
import { generateToken, hashToken, looksLikeToken } from "@/lib/tokens";
import { candidatesForEmail } from "@/lib/identity/link";
import { isOrgEmail } from "@/lib/identity/rules";
import { sendLoggedEmail } from "@/lib/email/send";
import { getRouteRecipients } from "@/lib/email-routing";
import { emailDomain, siteUrl } from "@/lib/site";
import { actorMemberId, can, EMAIL_CHANGES_PER_HOUR, type GuardianshipFacts } from "./permissions";
import { auditFamily, bad, forbidden, notFound, type EditResult, type PortalCtx } from "./context";

const DAY = 864e5;
const linkBox = (inner: string) => `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:560px">${inner}</div>`;

// ── loading helpers ──────────────────────────────────────────────────────────────────────────────────────────
async function members(householdId: string) {
  return prisma.householdMember.findMany({ where: { patientId: householdId }, orderBy: { createdAt: "asc" } });
}
async function guardianships(householdId: string): Promise<GuardianshipFacts[]> {
  return prisma.memberGuardianship.findMany({ where: { child: { patientId: householdId } }, select: { childMemberId: true, guardianMemberId: true, attestedAt: true } });
}
/** The acting adult's own member row (member actors only). Must still be a confirmed adult of THIS household. */
async function actingMember(ctx: PortalCtx) {
  if (ctx.actor.kind !== "member") return null;
  return prisma.householdMember.findFirst({ where: { id: ctx.actor.memberId, patientId: ctx.householdId, status: "confirmed", ageGroup: "18_plus" } });
}
async function actorFirstName(ctx: PortalCtx): Promise<string> {
  if (ctx.actor.kind === "member") return (await actingMember(ctx))?.firstName ?? "";
  return (await prisma.contactProfile.findUnique({ where: { patientId: ctx.householdId }, select: { firstName: true } }))?.firstName ?? "";
}
const householdLang = async (id: string): Promise<"en" | "es"> => ((await prisma.patient.findUnique({ where: { id }, select: { preferredLanguage: true } }))?.preferredLanguage === "es" ? "es" : "en");

// ── own profile ──────────────────────────────────────────────────────────────────────────────────────────────
/** Own name, phone and preferred language. Same validators as registration. Primary: the household's record; adult: their own row. */
export async function updateProfile(ctx: PortalCtx, i: { firstName: unknown; lastName: unknown; phone: unknown; language: unknown }): Promise<EditResult> {
  const firstName = cleanText(i.firstName, 100), lastName = cleanText(i.lastName, 100);
  if (!firstName) return bad("firstName");
  if (!lastName) return bad("lastName");
  const phoneRaw = cleanText(i.phone, 40), phone = normalizePhone(phoneRaw);
  if (phoneRaw && !phone) return bad("phone");
  const language = i.language === "es" ? "es" : "en";
  const changed: string[] = [];

  if (ctx.actor.kind === "primary") {
    const p = await prisma.patient.findUnique({ where: { id: ctx.householdId }, select: { email: true, preferredLanguage: true, contactProfile: true } });
    if (!p) return notFound();
    if (!p.email && !phone) return bad("contact"); // every household keeps at least one way to reach it
    if (p.contactProfile?.firstName !== firstName) changed.push("firstName");
    if (p.contactProfile?.lastName !== lastName) changed.push("lastName");
    if ((p.contactProfile?.phone ?? null) !== phone) changed.push("phone");
    if (p.preferredLanguage !== language) changed.push("language");
    await prisma.$transaction(async (tx) => {
      await tx.patient.update({ where: { id: ctx.householdId }, data: { preferredLanguage: language } });
      await tx.contactProfile.upsert({
        where: { patientId: ctx.householdId },
        update: { firstName, lastName, phone },
        create: { patientId: ctx.householdId, firstName, lastName, phone },
      });
      await auditFamily(ctx, AuditAction.PORTAL_PROFILE_CHANGED, "Patient", ctx.householdId, "Own details changed on the family page", { fields: changed }, tx);
    });
    return { ok: true };
  }

  const m = await actingMember(ctx);
  if (!m) return forbidden();
  if (m.firstName !== firstName) changed.push("firstName");
  if ((m.lastName ?? "") !== lastName) changed.push("lastName");
  if ((m.phone ?? null) !== phone) changed.push("phone");
  if ((m.preferredLanguage ?? "") !== language) changed.push("language");
  await prisma.$transaction(async (tx) => {
    await tx.householdMember.update({ where: { id: m.id }, data: { firstName, lastName, phone, preferredLanguage: language } });
    await auditFamily(ctx, AuditAction.PORTAL_PROFILE_CHANGED, "HouseholdMember", m.id, "Own details changed on the family page", { fields: changed }, tx);
  });
  return { ok: true };
}

/** The household's mailing address (any confirmed adult). */
export async function updateAddress(ctx: PortalCtx, address: unknown): Promise<EditResult> {
  if (!can(ctx.actor, "address.edit")) return forbidden();
  if (ctx.actor.kind === "member" && !(await actingMember(ctx))) return forbidden();
  const value = cleanText(address, 300) || null;
  await prisma.$transaction(async (tx) => {
    const cp = await tx.contactProfile.findUnique({ where: { patientId: ctx.householdId }, select: { id: true } });
    if (!cp) throw new Error("no_profile");
    await tx.contactProfile.update({ where: { id: cp.id }, data: { addressLine1: value } });
    await auditFamily(ctx, AuditAction.PORTAL_PROFILE_CHANGED, "Patient", ctx.householdId, "Mailing address changed on the family page", { fields: ["address"] }, tx);
  });
  return { ok: true };
}

// ── email change (takes effect only through the link sent to the NEW address) ─────────────────────────────────
export const EMAIL_NEUTRAL_MESSAGE = { en: "If this address can be used, we’ve sent it a confirmation link.", es: "Si esta dirección se puede usar, le enviamos un enlace de confirmación." } as const;

/**
 * The answer is the same whether or not the address can be used (no account probing). Unusable: the current address, an
 * org-domain address, or one that already identifies another person (primary, alias or confirmed adult), because a sign-in
 * must never match two people. The only visible failure is a malformed address.
 */
export async function requestEmailChange(ctx: PortalCtx, raw: unknown): Promise<EditResult<{ message: typeof EMAIL_NEUTRAL_MESSAGE }>> {
  const email = normalizeEmail(raw);
  if (!email || !isValidEmail(email)) return bad("email");
  const me = ctx.actor.kind === "member" ? await actingMember(ctx) : null;
  if (ctx.actor.kind === "member" && !me) return forbidden();

  const since = new Date(Date.now() - 3600_000);
  const recent = await prisma.auditLog.count({ where: { patientId: ctx.householdId, actorMemberId: actorMemberId(ctx.actor), action: AuditAction.PORTAL_EMAIL_CHANGE_REQUESTED, createdAt: { gte: since } } });
  if (recent >= EMAIL_CHANGES_PER_HOUR) return { ok: false, status: 429, error: "rate_limited" };

  const current = ctx.actor.kind === "member" ? me!.email : (await prisma.patient.findUnique({ where: { id: ctx.householdId }, select: { email: true } }))?.email;
  const taken = (await candidatesForEmail(email)).some((c) => !(ctx.actor.kind === "member" ? c.memberId === me!.id : c.id === ctx.householdId && !c.memberId));
  const usable = !taken && email !== (current ?? "").toLowerCase() && !isOrgEmail(email, emailDomain());

  let sent = false;
  if (usable) {
    const rawToken = generateToken();
    await prisma.$transaction([
      prisma.emailChangeRequest.deleteMany({ where: { patientId: ctx.householdId, householdMemberId: me?.id ?? null, usedAt: null } }), // an earlier link stops working
      prisma.emailChangeRequest.create({ data: { patientId: ctx.householdId, householdMemberId: me?.id ?? null, newEmail: email, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 2 * DAY) } }),
    ]);
    const link = `${siteUrl()}/portal/confirm-email/${rawToken}`;
    const r = await sendLoggedEmail({
      kind: "EMAIL_CHANGE_CONFIRMATION", sender: "noreply", to: email, // no patientId: this answers the person's own request, so a withdrawn data consent must not block it
      subject: "Confirm your new email / Confirme su nuevo correo",
      html: linkBox(`<p>Confirm your new email address for your HOEP family page: <a href="${link}">${link}</a></p><p>If you didn’t ask for this, ignore this email and nothing changes. The link works for 2 days.</p><hr/><p>Confirme su nuevo correo para su página familiar de HOEP: <a href="${link}">${link}</a></p><p>Si usted no lo pidió, ignore este correo y no cambiará nada. El enlace sirve por 2 días.</p>`),
    });
    sent = r.ok;
  }
  await auditFamily(ctx, AuditAction.PORTAL_EMAIL_CHANGE_REQUESTED, me ? "HouseholdMember" : "Patient", me?.id ?? ctx.householdId, "Email change requested on the family page", { fields: ["email"], sent });
  return { ok: true, message: EMAIL_NEUTRAL_MESSAGE };
}

/**
 * The link in the email: applies the change. It works only for the SAME signed-in person who asked (`signedIn` = the
 * session's household and actor), so a forwarded link is useless to anyone else. The sign-in stays linked (identities
 * are not keyed by email).
 */
export async function confirmEmailChange(rawToken: unknown, signedIn: PortalCtx): Promise<EditResult> {
  if (!looksLikeToken(rawToken)) return notFound();
  const r = await prisma.emailChangeRequest.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!r || r.usedAt || r.expiresAt.getTime() < Date.now()) return notFound();
  if (r.patientId !== signedIn.householdId || r.householdMemberId !== actorMemberId(signedIn.actor)) return notFound();
  const ctx: PortalCtx = signedIn;
  // still usable? (someone else may have taken it since)
  const taken = (await candidatesForEmail(r.newEmail)).some((c) => !(r.householdMemberId ? c.memberId === r.householdMemberId : c.id === r.patientId && !c.memberId));
  if (taken || isOrgEmail(r.newEmail, emailDomain())) return notFound();
  const applied = await prisma.$transaction(async (tx) => {
    const used = await tx.emailChangeRequest.updateMany({ where: { id: r.id, usedAt: null }, data: { usedAt: new Date() } });
    if (used.count !== 1) return false;
    if (r.householdMemberId) {
      const m = await tx.householdMember.updateMany({ where: { id: r.householdMemberId, patientId: r.patientId, status: "confirmed" }, data: { email: r.newEmail, confirmByPhone: false } });
      if (m.count !== 1) return false;
    } else {
      await tx.patient.update({ where: { id: r.patientId }, data: { email: r.newEmail } });
    }
    await auditFamily(ctx, AuditAction.PORTAL_EMAIL_CHANGED, r.householdMemberId ? "HouseholdMember" : "Patient", r.householdMemberId ?? r.patientId, "Email changed through the confirmation link", { fields: ["email"] }, tx);
    return true;
  });
  return applied ? { ok: true } : notFound();
}

// ── diagnoses ────────────────────────────────────────────────────────────────────────────────────────────────
/** Own diagnoses. The primary's go on the household record, an adult's on their own row. Never logged. */
export async function setOwnDiagnoses(ctx: PortalCtx, raw: unknown): Promise<EditResult> {
  const list = sanitizeDiagnoses(raw);
  const me = ctx.actor.kind === "member" ? await actingMember(ctx) : null;
  if (ctx.actor.kind === "member" && !me) return forbidden();
  await prisma.$transaction(async (tx) => {
    if (me) {
      await tx.householdMember.update({ where: { id: me.id }, data: { statedDiagnoses: list } });
      await auditFamily(ctx, AuditAction.PORTAL_DIAGNOSES_CHANGED, "HouseholdMember", me.id, "Own diagnoses changed on the family page", { subject: "self" }, tx);
    } else {
      await tx.patient.update({ where: { id: ctx.householdId }, data: { primaryDiagnoses: list } });
      await auditFamily(ctx, AuditAction.PORTAL_DIAGNOSES_CHANGED, "Patient", ctx.householdId, "Own diagnoses changed on the family page", { subject: "self" }, tx);
    }
    await recomputeHousehold(tx, ctx.householdId);
  });
  return { ok: true };
}

/** A minor's diagnoses: the primary, or an adult designated as that child's guardian who has attested. */
export async function setMinorDiagnoses(ctx: PortalCtx, memberId: string, raw: unknown): Promise<EditResult> {
  const m = await prisma.householdMember.findFirst({ where: { id: memberId, patientId: ctx.householdId } });
  if (!m) return notFound();
  if (!can(ctx.actor, "minor.diagnoses", { target: m, guardianships: await guardianships(ctx.householdId) })) return forbidden();
  await prisma.$transaction(async (tx) => {
    await tx.householdMember.update({ where: { id: m.id }, data: { statedDiagnoses: sanitizeDiagnoses(raw) } });
    await recomputeHousehold(tx, ctx.householdId);
    await auditFamily(ctx, AuditAction.PORTAL_DIAGNOSES_CHANGED, "HouseholdMember", m.id, "A minor's diagnoses changed on the family page", { subject: "minor", memberId: m.id }, tx);
  });
  return { ok: true };
}

// ── members ──────────────────────────────────────────────────────────────────────────────────────────────────
export interface NewMemberInput { firstName: unknown; lastName: unknown; relationship: unknown; ageGroup: unknown; email?: unknown; confirmByPhone?: unknown; diagnoses?: unknown }

/**
 * Add a minor, or an adult (who then gets the SAME confirmation link as at registration, or is confirmed by phone).
 * Any confirmed adult may add. A non-guardian adult can't set a new minor's diagnoses (nobody is that child's guardian
 * yet), so any diagnoses sent are dropped.
 */
export async function addMember(ctx: PortalCtx, raw: NewMemberInput): Promise<EditResult<{ memberId: string }>> {
  if (ctx.actor.kind === "member" && !(await actingMember(ctx))) return forbidden();
  const existing = await members(ctx.householdId);
  if (existing.length + 2 > MAX_HOUSEHOLD_SIZE) return bad("familySize");
  const v = validateMembers([raw], 2);
  if (!v.ok) return bad(v.field);
  const m = v.members[0];
  const isAdult = m.ageGroup === "18_plus";
  if (!isAdult && ctx.actor.kind !== "primary") m.statedDiagnoses = [];
  const rawToken = isAdult && m.email ? generateToken() : null;

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.householdMember.create({
      data: {
        patientId: ctx.householdId, firstName: m.firstName, lastName: m.lastName, relationship: m.relationship, ageGroup: m.ageGroup,
        statedDiagnoses: m.statedDiagnoses, email: m.email, confirmByPhone: m.confirmByPhone, status: m.status,
        ...(rawToken ? { confirmTokenHash: hashToken(rawToken), confirmTokenExpiresAt: new Date(Date.now() + CONFIRM_TOKEN_DAYS * DAY) } : {}),
      },
    });
    await recomputeHousehold(tx, ctx.householdId);
    await auditFamily(ctx, AuditAction.PORTAL_MEMBER_CHANGED, "HouseholdMember", row.id, "Household member added on the family page", { op: "add", memberId: row.id, adult: isAdult }, tx);
    return row;
  });
  if (rawToken && m.email) {
    await sendMemberConfirmation({ patientId: ctx.householdId, email: m.email, firstName: m.firstName, primaryFirstName: await actorFirstName(ctx), rawToken, language: await householdLang(ctx.householdId) });
  }
  return { ok: true, memberId: created.id };
}

/** A MINOR's name, relationship and age group (any confirmed adult). Becoming 18+ goes through convertMinor, never here. */
export async function editMinor(ctx: PortalCtx, memberId: string, i: { firstName: unknown; lastName: unknown; relationship: unknown; ageGroup: unknown }): Promise<EditResult> {
  if (ctx.actor.kind === "member" && !(await actingMember(ctx))) return forbidden();
  const m = await prisma.householdMember.findFirst({ where: { id: memberId, patientId: ctx.householdId } });
  if (!m) return notFound();
  if (!can(ctx.actor, "minor.edit", { target: m })) return forbidden();
  const firstName = cleanText(i.firstName, 100);
  if (!firstName) return bad("firstName");
  const relationship = RELATIONSHIPS.find((r) => r === i.relationship);
  const ageGroup = AGE_GROUPS.find((a) => a === i.ageGroup);
  if (!relationship) return bad("relationship");
  if (!ageGroup || ageGroup === "18_plus") return bad("ageGroup");
  const lastName = cleanText(i.lastName, 100) || null;
  const changed = [firstName !== m.firstName && "firstName", lastName !== m.lastName && "lastName", relationship !== m.relationship && "relationship", ageGroup !== m.ageGroup && "ageGroup"].filter(Boolean) as string[];
  await prisma.$transaction(async (tx) => {
    // an update with no change still moves updatedAt: that is how "yes, this age group is still right" is recorded
    await tx.householdMember.update({ where: { id: m.id }, data: { firstName, lastName, relationship, ageGroup } });
    await recomputeHousehold(tx, ctx.householdId);
    await auditFamily(ctx, AuditAction.PORTAL_MEMBER_CHANGED, "HouseholdMember", m.id, "A minor's details changed on the family page", { op: "edit", memberId: m.id, fields: changed }, tx);
  });
  return { ok: true };
}

/**
 * A minor turns 18: the primary or an attested guardian converts them. They become a PENDING adult and get the same
 * confirmation as any adult (link by email, or by phone). Their stated diagnoses are cleared: an adult's health
 * information is theirs to give when they confirm. Guardian designations for them end.
 */
export async function convertMinor(ctx: PortalCtx, memberId: string, i: { email?: unknown; confirmByPhone?: unknown }): Promise<EditResult> {
  const m = await prisma.householdMember.findFirst({ where: { id: memberId, patientId: ctx.householdId } });
  if (!m) return notFound();
  if (!can(ctx.actor, "minor.convert", { target: m, guardianships: await guardianships(ctx.householdId) })) return forbidden();
  const v = validateMembers([{ firstName: m.firstName, lastName: m.lastName, relationship: m.relationship, ageGroup: "18_plus", email: i.email, confirmByPhone: i.confirmByPhone }], 2);
  if (!v.ok) return bad(v.field === "members" ? "email" : v.field);
  const a = v.members[0];
  const rawToken = a.email ? generateToken() : null;
  await prisma.$transaction(async (tx) => {
    await tx.householdMember.update({
      where: { id: m.id },
      data: {
        ageGroup: "18_plus", status: "pending", statedDiagnoses: [], email: a.email, confirmByPhone: a.confirmByPhone, confirmedAt: null,
        confirmTokenHash: rawToken ? hashToken(rawToken) : null, confirmTokenExpiresAt: rawToken ? new Date(Date.now() + CONFIRM_TOKEN_DAYS * DAY) : null,
      },
    });
    await tx.memberGuardianship.deleteMany({ where: { childMemberId: m.id } });
    await recomputeHousehold(tx, ctx.householdId);
    await auditFamily(ctx, AuditAction.PORTAL_MEMBER_CHANGED, "HouseholdMember", m.id, "A minor was converted to an adult on the family page", { op: "convert", memberId: m.id }, tx);
  });
  if (rawToken && a.email && m.firstName) {
    await sendMemberConfirmation({ patientId: ctx.householdId, email: a.email, firstName: m.firstName, primaryFirstName: await actorFirstName(ctx), rawToken, language: await householdLang(ctx.householdId) });
  }
  return { ok: true };
}

/**
 * Primary only. Removes the person from the household: off every future RSVP (rows already checked in stay, as counts only),
 * the row is deleted, and a sign-in as that adult stops working (cascade). Guardian designations go with it.
 */
export async function removeMember(ctx: PortalCtx, memberId: string): Promise<EditResult> {
  const m = await prisma.householdMember.findFirst({ where: { id: memberId, patientId: ctx.householdId } });
  if (!m) return notFound();
  if (!can(ctx.actor, "member.remove", { target: m })) return forbidden();
  await prisma.$transaction(async (tx) => {
    await dropMemberFromRsvps(tx, m.id);
    await tx.householdMember.delete({ where: { id: m.id } });
    await recomputeHousehold(tx, ctx.householdId);
    await auditFamily(ctx, AuditAction.PORTAL_MEMBER_CHANGED, "HouseholdMember", m.id, "Household member removed on the family page", { op: "remove", memberId: m.id }, tx);
  });
  return { ok: true };
}

/**
 * An adult leaves the household. They keep nothing in it: consents they gave are withdrawn (the records stay as evidence),
 * the row is purged like a declined member (a counted placeholder), their sign-in is unlinked, future RSVP attendee rows go,
 * and the primary gets a link-only email (no name).
 */
export async function leaveHousehold(ctx: PortalCtx): Promise<EditResult> {
  if (!can(ctx.actor, "household.leave")) return forbidden();
  const me = await actingMember(ctx);
  if (!me) return forbidden();
  await prisma.$transaction(async (tx) => {
    const rows = await tx.consentRecord.findMany({ where: { householdMemberId: me.id }, select: { type: true, granted: true, createdAt: true }, orderBy: { createdAt: "desc" } });
    const current = new Map<string, boolean>();
    for (const r of rows) if (!current.has(r.type)) current.set(r.type, r.granted);
    for (const [type, granted] of Array.from(current)) {
      if (granted && type !== "adult_attestation" && type !== "age_guardian_attestation")
        await tx.consentRecord.create({ data: { householdMemberId: me.id, type, granted: false, textVersion: CONSENT_TEXT_VERSION, method: "portal", reasonCode: "LEFT_HOUSEHOLD" } });
    }
    await tx.userIdentity.updateMany({ where: { householdMemberId: me.id }, data: { patientId: null, householdMemberId: null, linkedAt: null, linkedVia: "unlinked" } });
    await tx.memberGuardianship.deleteMany({ where: { OR: [{ guardianMemberId: me.id }, { childMemberId: me.id }] } });
    await dropMemberFromRsvps(tx, me.id);
    await tx.householdMember.update({ where: { id: me.id }, data: { ...purgedMemberData("declined"), phone: null, preferredLanguage: null } });
    await recomputeHousehold(tx, ctx.householdId);
    await auditFamily(ctx, AuditAction.PORTAL_MEMBER_LEFT, "HouseholdMember", me.id, "An adult left the household on the family page", { op: "leave", memberId: me.id }, tx);
  });
  const primary = await prisma.patient.findUnique({ where: { id: ctx.householdId }, select: { email: true } });
  if (primary?.email) {
    const link = `${siteUrl()}/portal`;
    await sendLoggedEmail({
      kind: "MEMBER_LEFT_NOTICE", sender: "noreply", to: primary.email,
      subject: "An adult left your household / Un adulto salió de su hogar",
      html: linkBox(`<p>An adult in your household left it on your HOEP family page. You can review your household here: <a href="${link}">${link}</a></p><hr/><p>Un adulto de su hogar salió de él en su página familiar de HOEP. Puede revisar su hogar aquí: <a href="${link}">${link}</a></p>`),
    }).catch(() => undefined);
  }
  return { ok: true };
}

// ── guardians ────────────────────────────────────────────────────────────────────────────────────────────────
/** Primary only: designate a confirmed adult as a minor's co-guardian. It applies once that adult attests on their next sign-in. */
export async function designateGuardian(ctx: PortalCtx, childId: string, guardianId: string): Promise<EditResult> {
  const child = await prisma.householdMember.findFirst({ where: { id: childId, patientId: ctx.householdId } });
  if (!child) return notFound();
  if (!can(ctx.actor, "guardian.designate", { target: child })) return forbidden();
  const guardian = await prisma.householdMember.findFirst({ where: { id: guardianId, patientId: ctx.householdId, status: "confirmed", ageGroup: "18_plus" } });
  if (!guardian) return notFound();
  await prisma.$transaction(async (tx) => {
    await tx.memberGuardianship.upsert({ where: { childMemberId_guardianMemberId: { childMemberId: childId, guardianMemberId: guardianId } }, create: { childMemberId: childId, guardianMemberId: guardianId }, update: {} });
    await auditFamily(ctx, AuditAction.PORTAL_GUARDIAN_CHANGED, "MemberGuardianship", childId, "Guardian designated on the family page", { op: "designate", childMemberId: childId, guardianMemberId: guardianId }, tx);
  });
  return { ok: true };
}

/** The primary removes a designation, or the designated adult steps down. */
export async function revokeGuardian(ctx: PortalCtx, childId: string, guardianId: string): Promise<EditResult> {
  const self = ctx.actor.kind === "member" && ctx.actor.memberId === guardianId;
  if (ctx.actor.kind !== "primary" && !self) return forbidden();
  const g = await prisma.memberGuardianship.findFirst({ where: { childMemberId: childId, guardianMemberId: guardianId, child: { patientId: ctx.householdId } } });
  if (!g) return notFound();
  await prisma.$transaction(async (tx) => {
    await tx.memberGuardianship.delete({ where: { id: g.id } });
    await auditFamily(ctx, AuditAction.PORTAL_GUARDIAN_CHANGED, "MemberGuardianship", childId, self ? "Guardian stepped down on the family page" : "Guardian designation removed on the family page", { op: self ? "step_down" : "revoke", childMemberId: childId, guardianMemberId: guardianId }, tx);
  });
  return { ok: true };
}

/** The designated adult accepts "I am this child's parent or legal guardian" (consent v4). Their guardian permissions start now. */
export async function acceptGuardianAttestation(ctx: PortalCtx): Promise<EditResult<{ accepted: number }>> {
  const me = await actingMember(ctx);
  if (!me) return forbidden();
  const pending = await prisma.memberGuardianship.findMany({ where: { guardianMemberId: me.id, attestedAt: null, child: { patientId: ctx.householdId } }, select: { id: true, childMemberId: true } });
  if (pending.length === 0) return { ok: true, accepted: 0 };
  await prisma.$transaction(async (tx) => {
    await tx.consentRecord.create({ data: { householdMemberId: me.id, type: "age_guardian_attestation", granted: true, textVersion: CONSENT_TEXT_VERSION, method: "portal" } });
    await tx.memberGuardianship.updateMany({ where: { id: { in: pending.map((p) => p.id) } }, data: { attestedAt: new Date() } });
    await auditFamily(ctx, AuditAction.PORTAL_GUARDIAN_CHANGED, "MemberGuardianship", me.id, "Guardian attestation accepted on the family page", { op: "attest", childMemberIds: pending.map((p) => p.childMemberId) }, tx);
  });
  return { ok: true, accepted: pending.length };
}

// ── deletion request (deletes nothing) ───────────────────────────────────────────────────────────────────────
/**
 * The primary asks to delete the household; an adult asks to delete their own data. A LINK-ONLY email goes to the
 * `privacy.requests` route and the request is logged. Nothing is deleted: the privacy runbook (docs/legal/RUNBOOK.md) does that.
 * Once per person per day.
 */
export async function requestDeletion(ctx: PortalCtx): Promise<EditResult> {
  const scope = ctx.actor.kind === "primary" ? "household" : "self";
  if (!can(ctx.actor, scope === "household" ? "household.request_deletion" : "own.request_deletion")) return forbidden();
  if (ctx.actor.kind === "member" && !(await actingMember(ctx))) return forbidden();
  const recent = await prisma.auditLog.count({ where: { patientId: ctx.householdId, actorMemberId: actorMemberId(ctx.actor), action: AuditAction.PORTAL_DELETION_REQUESTED, createdAt: { gte: new Date(Date.now() - DAY) } } });
  if (recent > 0) return { ok: true }; // already asked today: same answer, no second email
  await auditFamily(ctx, AuditAction.PORTAL_DELETION_REQUESTED, "Patient", ctx.householdId, "Deletion requested on the family page", { scope });
  const link = `${siteUrl()}/admin/patients/${ctx.householdId}`;
  const what = scope === "household" ? ["delete their household", "eliminar su hogar"] : ["delete their own data", "eliminar sus propios datos"];
  await sendLoggedEmail({
    kind: "DELETION_REQUEST_NOTICE", sender: "noreply", to: await getRouteRecipients("privacy.requests"),
    subject: "A privacy request needs review / Una solicitud de privacidad necesita revisión",
    html: linkBox(`<p>A family asked to ${what[0]} on the family page. Nothing was deleted. Review it with the privacy runbook: <a href="${link}">${link}</a></p><hr/><p>Una familia pidió ${what[1]} en la página familiar. No se eliminó nada. Revíselo con el manual de privacidad: <a href="${link}">${link}</a></p>`),
  }).catch(() => undefined);
  return { ok: true };
}
