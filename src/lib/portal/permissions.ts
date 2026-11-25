/**
 * Who may do what on the family page. PURE (no DB, no Next): unit-tested in scripts/check-portal-edits.ts.
 *
 * The household always comes from the session. The ACTOR is either the primary or one confirmed adult member.
 *  - Everyone edits their OWN name, phone, language, email, consents and diagnoses, and the mailing address.
 *  - Any confirmed adult can add members and edit a minor's name, relationship and age group.
 *  - A minor's diagnoses, and converting a minor to an adult, belong to the primary and to adults the primary designated
 *    as that child's guardian AFTER they accepted the guardian attestation (attestedAt set).
 *  - Only the primary removes members or asks to delete the household. A member can only leave, or ask to delete their own data.
 *  - Nobody ever sees or edits another adult's consents or diagnoses, not even the primary.
 */
export type Actor = { kind: "primary" } | { kind: "member"; memberId: string };

export interface MemberFacts { id: string; ageGroup: string; status: string }
export interface GuardianshipFacts { childMemberId: string; guardianMemberId: string; attestedAt: Date | null }

export const isMinor = (m: Pick<MemberFacts, "ageGroup">) => m.ageGroup !== "18_plus";
export const isConfirmedAdult = (m: Pick<MemberFacts, "ageGroup" | "status">) => m.ageGroup === "18_plus" && m.status === "confirmed";

/** The primary is always a guardian. A member is one only for a child they were designated for AND have attested. */
export function isGuardianOf(actor: Actor, childId: string, guardianships: GuardianshipFacts[]): boolean {
  if (actor.kind === "primary") return true;
  return guardianships.some((g) => g.childMemberId === childId && g.guardianMemberId === actor.memberId && g.attestedAt !== null);
}

export type Action =
  | "profile.edit_own"
  | "email.edit_own"
  | "consent.edit_own"
  | "diagnoses.edit_own"
  | "address.edit"
  | "flyer.edit"
  | "contact.edit"
  | "member.add"
  | "minor.edit"
  | "minor.diagnoses"
  | "minor.convert"
  | "member.remove"
  | "household.leave"
  | "household.request_deletion"
  | "own.request_deletion"
  | "guardian.designate"
  | "guardian.step_down";

export interface Ctx {
  /** The member the action is about (a minor for minor.*, an adult for member.remove, guardian.designate's CHILD). */
  target?: MemberFacts | null;
  guardianships?: GuardianshipFacts[];
}

export function can(actor: Actor, action: Action, ctx: Ctx = {}): boolean {
  const guards = ctx.guardianships ?? [];
  const t = ctx.target ?? null;
  switch (action) {
    case "profile.edit_own":
    case "email.edit_own":
    case "consent.edit_own":
    case "diagnoses.edit_own":
    case "address.edit":
    case "flyer.edit":
    case "contact.edit":
    case "member.add":
      return true;
    case "minor.edit":
      return !!t && isMinor(t);
    case "minor.diagnoses":
    case "minor.convert":
      return !!t && isMinor(t) && isGuardianOf(actor, t.id, guards);
    case "member.remove":
      return actor.kind === "primary" && !!t;
    case "household.leave":
      return actor.kind === "member";
    case "household.request_deletion":
      return actor.kind === "primary";
    case "own.request_deletion":
      return actor.kind === "member";
    case "guardian.designate":
      return actor.kind === "primary" && !!t && isMinor(t);
    case "guardian.step_down":
      return actor.kind === "member";
  }
}

/** Another adult's consents and diagnoses are private to that adult. `subject` = whose they are. */
export function canSeeAdultPrivate(actor: Actor, subject: Actor): boolean {
  if (actor.kind !== subject.kind) return false;
  return actor.kind === "primary" || (subject.kind === "member" && actor.memberId === subject.memberId);
}

/** The audit actor id for a family action: the acting adult's member id, or null for the primary (the household id is the patientId). */
export const actorMemberId = (a: Actor) => (a.kind === "member" ? a.memberId : null);

/** Max family-page changes per person per minute (counted from the audit log, so it holds across serverless instances). */
export const EDITS_PER_MINUTE = 30;
/** Max email-change requests per person per hour. */
export const EMAIL_CHANGES_PER_HOUR = 3;

/** A 13–17 age group that has not been looked at for a year is worth a "has this changed?" prompt. */
export function needsAgeCheck(m: { ageGroup: string; updatedAt: Date }, now = new Date()): boolean {
  return m.ageGroup === "13_17" && now.getTime() - m.updatedAt.getTime() > 365 * 864e5;
}
