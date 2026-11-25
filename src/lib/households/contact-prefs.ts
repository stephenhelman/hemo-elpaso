import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { pickAlsoSendIds } from "./also-send";

/**
 * Contact preferences. Shared by the family page (any confirmed adult) and the admin patient page.
 *  - "Also send invitations to": which CONFIRMED adults with an email also get invitation and confirmation emails. The primary always does.
 *  - "Can this number get texts?": yes / no / not stated, for the primary's phone and each adult's own phone. Stored only (no texting yet).
 * Every change is logged with ids and the field name only: never an email address, a phone number or a name.
 */
type Actor = { type: "board"; patientId: string } | { type: "family"; memberId: string | null };
const actorFields = (actor: Actor, householdId: string) => ({
  actorType: actor.type,
  actorPatientId: actor.type === "board" ? actor.patientId : householdId,
  actorMemberId: actor.type === "family" ? actor.memberId : null,
});

export async function setAlsoSendTo(householdId: string, wanted: unknown, actor: Actor): Promise<{ ok: true; ids: string[]; changed: boolean } | { ok: false; error: "invalid" | "not_found" }> {
  if (!Array.isArray(wanted) || wanted.some((x) => typeof x !== "string")) return { ok: false, error: "invalid" };
  const p = await prisma.patient.findUnique({ where: { id: householdId }, select: { alsoSendToMemberIds: true, householdMembers: { select: { id: true, status: true, ageGroup: true, email: true, preferredLanguage: true } } } });
  if (!p) return { ok: false, error: "not_found" };
  const ids = pickAlsoSendIds(p.householdMembers, wanted);
  if (ids.length !== new Set(wanted as string[]).size) return { ok: false, error: "invalid" }; // someone who isn't a confirmed adult with an email
  const before = [...p.alsoSendToMemberIds].sort().join(",");
  if (before === [...ids].sort().join(",")) return { ok: true, ids, changed: false };
  await prisma.patient.update({ where: { id: householdId }, data: { alsoSendToMemberIds: ids } });
  await audit({
    ...actorFields(actor, householdId), action: AuditAction.ALSO_SEND_TO_CHANGED, resourceType: "Patient", resourceId: householdId,
    details: "Also-send-invitations-to list changed", changes: { householdId, memberIds: ids, previousMemberIds: p.alsoSendToMemberIds, actor: actor.type === "board" ? actor.patientId : actor.memberId ?? householdId },
  });
  return { ok: true, ids, changed: true };
}

const asTri = (v: unknown): boolean | null | undefined => (v === true ? true : v === false ? false : v === null ? null : undefined);

/** target = the primary (household's phone) or one adult member (their own phone). `value` true | false | null (not stated). */
export async function setPhoneCanText(
  householdId: string, target: { kind: "primary" } | { kind: "member"; memberId: string }, value: unknown, actor: Actor,
): Promise<{ ok: true; changed: boolean } | { ok: false; error: "invalid" | "not_found" | "no_phone" }> {
  const v = asTri(value);
  if (v === undefined) return { ok: false, error: "invalid" };
  if (target.kind === "primary") {
    const p = await prisma.patient.findUnique({ where: { id: householdId }, select: { phoneCanText: true, contactProfile: { select: { phone: true } } } });
    if (!p) return { ok: false, error: "not_found" };
    if (v !== null && !p.contactProfile?.phone) return { ok: false, error: "no_phone" };
    if ((p.phoneCanText ?? null) === v) return { ok: true, changed: false };
    await prisma.patient.update({ where: { id: householdId }, data: { phoneCanText: v } });
  } else {
    const m = await prisma.householdMember.findFirst({ where: { id: target.memberId, patientId: householdId, ageGroup: "18_plus", status: "confirmed" }, select: { id: true, phone: true, phoneCanText: true } });
    if (!m) return { ok: false, error: "not_found" };
    if (v !== null && !m.phone) return { ok: false, error: "no_phone" };
    if ((m.phoneCanText ?? null) === v) return { ok: true, changed: false };
    await prisma.householdMember.update({ where: { id: m.id }, data: { phoneCanText: v } });
  }
  await audit({
    ...actorFields(actor, householdId), action: AuditAction.PHONE_TEXT_PREF_CHANGED, resourceType: target.kind === "primary" ? "Patient" : "HouseholdMember", resourceId: target.kind === "primary" ? householdId : target.memberId,
    details: "Text-message preference changed", changes: { householdId, fields: ["phoneCanText"], actor: actor.type === "board" ? actor.patientId : actor.memberId ?? householdId },
  });
  return { ok: true, changed: true };
}
