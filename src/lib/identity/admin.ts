import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { emailDomain, mailbox } from "@/lib/site";
import { BOARD_ONLY, HOUSEHOLD_EVIDENCE } from "@/lib/patients/query";
import { isOrgEmail, isOrgIdentity, normalizeEmail } from "./rules";

export type Result<T = object> = ({ ok: true } & T) | { ok: false; status: number; error: string };
export interface Actor { id: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A board record's sign-in address must be an org address, and never the settings-only admin mailbox. */
export function validateOrgEmail(raw: string): { ok: true; email: string } | { ok: false; error: "invalid_email" | "not_org_email" | "admin_mailbox" } {
  const email = normalizeEmail(raw);
  if (!EMAIL_RE.test(email)) return { ok: false, error: "invalid_email" };
  if (!isOrgEmail(email, emailDomain())) return { ok: false, error: "not_org_email" };
  if (email === mailbox("admin").toLowerCase()) return { ok: false, error: "admin_mailbox" };
  return { ok: true, email };
}

// ---- Admin (settings-only). Board-only records; never a record that has a household. ---------------------------

/**
 * Set the org email on a board record. The next sign-in with that Google Workspace account links itself (verified
 * email matches exactly one record). Refused for a record that has household data (President/VP handles those) and
 * when another record already uses the address (it would make the sign-in ambiguous).
 */
export async function setBoardOrgEmail(patientId: string, rawEmail: string, actor: Actor): Promise<Result<{ email: string }>> {
  const v = validateOrgEmail(rawEmail);
  if (!v.ok) return { ok: false, status: 400, error: v.error };
  const rec = await prisma.patient.findFirst({ where: { id: patientId, ...BOARD_ONLY }, select: { id: true, email: true } });
  if (!rec) return { ok: false, status: 404, error: "not_found_or_has_household" };
  const clash = await prisma.patient.count({ where: { id: { not: patientId }, email: { equals: v.email, mode: "insensitive" } } });
  if (clash > 0) return { ok: false, status: 409, error: "email_in_use" };
  if (rec.email === v.email) return { ok: true, email: v.email };
  await prisma.patient.update({ where: { id: patientId }, data: { email: v.email } });
  await audit({ actorType: "board", actorPatientId: actor.id, action: AuditAction.BOARD_ORG_EMAIL_CHANGED, resourceType: "Patient", resourceId: patientId, details: "Org email set on a board record", changes: { patientId } });
  return { ok: true, email: v.email };
}

/**
 * Unlink an ORG identity from a board record. The row is kept as unmatched with linkedVia "unlinked", so the same
 * sign-in is not re-linked automatically on its next login: only the President/VP can link it again.
 */
export async function unlinkBoardOrgIdentity(patientId: string, identityId: string, actor: Actor): Promise<Result> {
  const rec = await prisma.patient.findFirst({ where: { id: patientId, ...BOARD_ONLY }, select: { id: true } });
  if (!rec) return { ok: false, status: 404, error: "not_found_or_has_household" };
  const ident = await prisma.userIdentity.findFirst({ where: { id: identityId, patientId } });
  if (!ident) return { ok: false, status: 404, error: "identity_not_found" };
  if (!isOrgIdentity(ident, emailDomain())) return { ok: false, status: 403, error: "not_an_org_identity" };
  return doUnlink(ident.id, patientId, { id: actor.id });
}

// ---- President / VP (canManageUsers). Anything that touches family data. ----------------------------------------

async function doUnlink(identityId: string, patientId: string, actor: Actor): Promise<Result> {
  await prisma.userIdentity.update({ where: { id: identityId }, data: { patientId: null, householdMemberId: null, linkedAt: null, linkedVia: "unlinked", linkedByPatientId: actor.id } });
  await audit({ actorType: "board", actorPatientId: actor.id, action: AuditAction.IDENTITY_UNLINKED, resourceType: "UserIdentity", resourceId: identityId, details: "Sign-in unlinked", changes: { patientId } });
  return { ok: true };
}

/** Unlink any identity of a non-admin person. */
export async function unlinkIdentity(identityId: string, actor: Actor): Promise<Result> {
  const ident = await prisma.userIdentity.findUnique({ where: { id: identityId }, select: { id: true, patientId: true, patient: { select: { role: true } } } });
  if (!ident?.patientId) return { ok: false, status: 404, error: "identity_not_found" };
  if (ident.patient?.role === "admin") return { ok: false, status: 403, error: "admin_record" };
  return doUnlink(ident.id, ident.patientId, actor);
}

/** Link an unmatched sign-in to a person by hand (Apple "Hide my email", a different address than registered, ...). */
export async function linkIdentity(identityId: string, patientId: string, actor: Actor, memberId?: string | null): Promise<Result> {
  const ident = await prisma.userIdentity.findUnique({ where: { id: identityId }, select: { id: true, patientId: true } });
  if (!ident) return { ok: false, status: 404, error: "identity_not_found" };
  if (ident.patientId) return { ok: false, status: 409, error: "already_linked" };
  const person = await prisma.patient.findFirst({ where: { id: patientId, role: { not: "admin" } }, select: { id: true } });
  if (!person) return { ok: false, status: 404, error: "person_not_found" };
  // Linking to an adult member: the household is the member's household, and only a confirmed adult can be linked.
  if (memberId) {
    const m = await prisma.householdMember.findFirst({ where: { id: memberId, patientId, status: "confirmed", ageGroup: "18_plus" }, select: { id: true } });
    if (!m) return { ok: false, status: 404, error: "member_not_found" };
  }
  await prisma.userIdentity.update({ where: { id: identityId }, data: { patientId, householdMemberId: memberId ?? null, linkedAt: new Date(), linkedVia: "admin", linkedByPatientId: actor.id } });
  await audit({ actorType: "board", actorPatientId: actor.id, action: AuditAction.IDENTITY_LINKED, resourceType: "UserIdentity", resourceId: identityId, details: "Sign-in linked by hand", changes: { patientId, memberId: memberId ?? null, via: "admin" } });
  return { ok: true };
}

export const PURGE_UNMATCHED_DAYS = 30;

/** Retention: sign-ins that never matched anyone are deleted 30 days after their last use. Counts only. */
export async function purgeUnmatchedIdentities(now = new Date()): Promise<{ identities: number }> {
  const r = await prisma.userIdentity.deleteMany({ where: { patientId: null, lastLoginAt: { lt: new Date(now.getTime() - PURGE_UNMATCHED_DAYS * 864e5) } } });
  return { identities: r.count };
}

export async function hasHousehold(patientId: string): Promise<boolean> {
  return (await prisma.patient.count({ where: { id: patientId, ...HOUSEHOLD_EVIDENCE } })) > 0;
}
