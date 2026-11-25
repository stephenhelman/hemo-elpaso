/**
 * Sign-in identity rules. PURE (no DB, no Next, no env): the mail domain and the setting are always passed in, so the
 * rules are unit-tested (scripts/check-identities.ts).
 *
 * Auth0 only proves who signed in. The database decides everything else, per request, from the Auth0 `sub`:
 *   board   the identity is an @<mail domain> Google Workspace account AND its person is an admin or holds an active
 *           board role. Board sessions can open /admin and (if they have a household) /portal.
 *   family  everything else that is linked to a person. /portal only, never /admin, even for someone who holds a board
 *           role and signed in with a personal Gmail.
 *   none    signed in, but not linked to anyone yet.
 * Nothing about the mode is stored in a cookie: it is recomputed on every request, so it can't be forged or go stale.
 */

/** Board mode needs a Google Workspace org account. An Apple, Facebook or emailed-code identity can never reach /admin. */
export const BOARD_PROVIDER = "google-oauth2";

/**
 * Providers a family can sign in with. "email" is Auth0 passwordless (a one-time code sent to the address, connection
 * "email", sub "email|..."): receiving the code proves the address, so it is verified by definition. Board mode is NOT
 * affected: it needs BOARD_PROVIDER (google-oauth2) AND an org-domain address, so a code sent to an @org address still
 * gives family mode only.
 */
export const FAMILY_PROVIDERS = ["google-oauth2", "apple", "facebook", "email"] as const;
export const EMAIL_CODE_PROVIDER = "email";

/** Is this sign-in's email verified? The provider's claim, or true by definition for an emailed one-time code. */
export function emailVerifiedFor(provider: string, claim: boolean | null | undefined): boolean {
  return claim === true || provider === EMAIL_CODE_PROVIDER;
}

export type LinkedVia = "auto" | "admin" | "merge" | "backfill";

export interface IdentityFacts {
  provider: string;
  email: string;
  emailVerified: boolean;
  linkedVia: string | null;
}

export const normalizeEmail = (e: string | null | undefined) => (e ?? "").trim().toLowerCase();

/** "google-oauth2|1234" -> "google-oauth2". Anything without a prefix is "unknown". */
export function providerOf(sub: string): string {
  const i = sub.indexOf("|");
  return i > 0 ? sub.slice(0, i) : "unknown";
}

/** Exact domain match on a verified address. "evil-hemoelpaso.org" and "x@mail.hemoelpaso.org" do not match. */
export function isOrgEmail(email: string | null | undefined, domain: string): boolean {
  const e = normalizeEmail(email);
  const at = e.split("@");
  return at.length === 2 && at[0].length > 0 && at[1] === domain.trim().toLowerCase();
}

export function isOrgIdentity(i: Pick<IdentityFacts, "provider" | "email" | "emailVerified">, domain: string): boolean {
  return i.emailVerified === true && i.provider === BOARD_PROVIDER && isOrgEmail(i.email, domain);
}

export interface SessionFacts {
  identity: IdentityFacts | null; // null = no linked identity
  /** Patient.role of the linked person. */
  patientRole: string | null;
  /** Active BoardRole count of the linked person. */
  activeBoardRoles: number;
  /** "Board sign-in requires an @hemoelpaso.org account" */
  requireOrgAccount: boolean;
  domain: string;
}

export type Mode = "board" | "family" | "none";

/**
 * Board eligibility:
 *  - the person must be role admin, or role board with at least one active board role;
 *  - an org identity always qualifies;
 *  - while the setting is OFF, an identity that existed before this change (linkedVia "backfill") keeps board access
 *    as it had. Nothing linked after that (auto/admin/merge) ever gets board access without being an org identity.
 */
export function resolveMode(f: SessionFacts): Mode {
  if (!f.identity || !f.patientRole) return "none";
  const staff = f.patientRole === "admin" || (f.patientRole === "board" && f.activeBoardRoles > 0);
  if (!staff) return "family";
  if (isOrgIdentity(f.identity, f.domain)) return "board";
  if (!f.requireOrgAccount && f.identity.linkedVia === "backfill") return "board";
  return "family";
}

// ---- auto-link ----------------------------------------------------------------------------------------------

export type LinkDecision =
  | { kind: "ignore"; reason: "unverified_email" }
  | { kind: "link"; patientId: string; memberId: string | null }
  | { kind: "unmatched" } // zero matches
  | { kind: "ambiguous"; patientIds: string[] }; // two or more

/** A person a verified email may belong to: the household's primary (no memberId) or one of its confirmed adults. */
export interface LinkCandidate { id: string; memberId?: string | null }

/**
 * First sign-in. A VERIFIED email must match exactly one person: a primary's Patient.email (or alias) OR one confirmed adult
 * member's email. Anything else is not linked: two or more matches ACROSS BOTH (a primary and a member sharing an address,
 * or two households) are ambiguous, and an officer links the sign-in by hand.
 */
export function decideLink(emailVerified: boolean | null | undefined, candidates: LinkCandidate[]): LinkDecision {
  if (emailVerified !== true) return { kind: "ignore", reason: "unverified_email" };
  if (candidates.length === 0) return { kind: "unmatched" };
  if (candidates.length === 1) return { kind: "link", patientId: candidates[0].id, memberId: candidates[0].memberId ?? null };
  return { kind: "ambiguous", patientIds: candidates.map((c) => (c.memberId ? `${c.id}:${c.memberId}` : c.id)).sort() };
}

// ---- officer transition -------------------------------------------------------------------------------------

export const OFFICER_ROLES = ["PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER"] as const;

export interface OfficerView {
  patientId: string;
  role: (typeof OFFICER_ROLES)[number];
  hasOrgIdentity: boolean;
}

/** The setting can be turned ON only when every officer role is held by someone who already has an org identity. */
export function canRequireOrg(officers: OfficerView[]): { ok: true } | { ok: false; missing: string[] } {
  const missing: string[] = [];
  for (const role of OFFICER_ROLES) {
    const holders = officers.filter((o) => o.role === role);
    if (holders.length === 0 || holders.some((h) => !h.hasOrgIdentity)) missing.push(role);
  }
  return missing.length ? { ok: false, missing } : { ok: true };
}

// ---- who may touch which record -----------------------------------------------------------------------------

/**
 * Separation of duties. Admin (settings-only) may handle a board record only if it holds NO household data.
 * Linking identities to households, merging and unlinking family identities need canManageUsers (President / VP).
 */
export function adminMayTouch(record: { hasHousehold: boolean; role: string }): boolean {
  return record.role === "board" && !record.hasHousehold;
}

export type MergeChoice =
  | { ok: true; keepId: string; dropId: string }
  | { ok: false; error: "admin_record" | "same_record" | "needs_keep_choice" | "bad_keep" };

/**
 * Which record survives a merge. Admin records never merge. If both have a household, the President/VP must say which
 * one survives (`keepId`). If only one has a household it survives (a board-only record folds into it). If neither
 * does, the older survives unless a choice was made.
 */
export function chooseSurvivor(
  a: { id: string; role: string; hasHousehold: boolean; createdAt: Date },
  b: { id: string; role: string; hasHousehold: boolean; createdAt: Date },
  keepId?: string | null,
): MergeChoice {
  if (a.id === b.id) return { ok: false, error: "same_record" };
  if (a.role === "admin" || b.role === "admin") return { ok: false, error: "admin_record" };
  if (keepId && keepId !== a.id && keepId !== b.id) return { ok: false, error: "bad_keep" };
  const other = (id: string) => (id === a.id ? b.id : a.id);
  if (a.hasHousehold && b.hasHousehold) {
    if (!keepId) return { ok: false, error: "needs_keep_choice" };
    return { ok: true, keepId, dropId: other(keepId) };
  }
  if (a.hasHousehold !== b.hasHousehold) {
    const keep = a.hasHousehold ? a : b;
    if (keepId && keepId !== keep.id) return { ok: false, error: "bad_keep" };
    return { ok: true, keepId: keep.id, dropId: other(keep.id) };
  }
  const keep = keepId ? (keepId === a.id ? a : b) : a.createdAt <= b.createdAt ? a : b;
  return { ok: true, keepId: keep.id, dropId: other(keep.id) };
}
