/**
 * Merge conflict rules. PURE (no DB, no Next, no env): unit-tested in scripts/check-merge.ts.
 * "keep" = the surviving record, "drop" = the record folded into it (it becomes a tombstone).
 */

// ── helpers ───────────────────────────────────────────────────────────────────────────────────────────────────
/** Lowercase, trim, strip accents, collapse spaces: "José  Pérez" and "jose perez" are the same name. */
export const normName = (s: string | null | undefined) =>
  (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/\s+/g, " ");

export const normEmail = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

/** Two ids in a stable order (dismissals and duplicate pairs are stored sorted). */
export const pairKey = (a: string, b: string): [string, string] => (a < b ? [a, b] : [b, a]);

// ── household members ─────────────────────────────────────────────────────────────────────────────────────────
export interface MemberFacts { id: string; firstName: string | null; lastName: string | null; ageGroup: string; status: string }

/** Same person = same normalized first + last name and the same age group. A member without a first name never matches. */
export function memberKey(m: Pick<MemberFacts, "firstName" | "lastName" | "ageGroup">): string | null {
  const first = normName(m.firstName);
  return first ? `${first}|${normName(m.lastName)}|${m.ageGroup}` : null;
}

/** Each dropped member matches at most one kept member and vice versa. Unmatched dropped members simply move. */
export function pairMembers(keep: MemberFacts[], drop: MemberFacts[]) {
  const used = new Set<string>();
  const pairs: { keepId: string; dropId: string }[] = [];
  const unmatched: MemberFacts[] = [];
  for (const d of drop) {
    const k = memberKey(d);
    const hit = k ? keep.find((x) => !used.has(x.id) && memberKey(x) === k) : undefined;
    if (hit) { used.add(hit.id); pairs.push({ keepId: hit.id, dropId: d.id }); } else unmatched.push(d);
  }
  return { pairs, unmatched };
}

const MEMBER_RANK: Record<string, number> = { confirmed: 3, pending: 2, not_required: 2, declined: 0, expired: 0 };
/** The row that survives a matched pair. The kept household's row wins unless the other is further along (a confirmed adult beats a pending one). */
export function pickMember(keep: Pick<MemberFacts, "status">, drop: Pick<MemberFacts, "status">): "keep" | "drop" {
  return (MEMBER_RANK[drop.status] ?? 0) > (MEMBER_RANK[keep.status] ?? 0) ? "drop" : "keep";
}

// ── RSVPs ────────────────────────────────────────────────────────────────────────────────────────────────────
export interface RsvpFacts { id: string; cancelled: boolean; checkedIn: number; attendees: number; rsvpDate: Date }
export type RsvpRule = "active_over_cancelled" | "checked_in" | "more_attendees" | "more_recent" | "tie_keeps_survivor";

/** Same event on both records: active over cancelled, then checked-in, then the larger party, then the newer RSVP. */
export function pickRsvp(keep: RsvpFacts, drop: RsvpFacts): { winner: "keep" | "drop"; rule: RsvpRule } {
  if (keep.cancelled !== drop.cancelled) return { winner: keep.cancelled ? "drop" : "keep", rule: "active_over_cancelled" };
  if ((keep.checkedIn > 0) !== (drop.checkedIn > 0)) return { winner: drop.checkedIn > 0 ? "drop" : "keep", rule: "checked_in" };
  if (keep.attendees !== drop.attendees) return { winner: drop.attendees > keep.attendees ? "drop" : "keep", rule: "more_attendees" };
  if (keep.rsvpDate.getTime() !== drop.rsvpDate.getTime()) return { winner: drop.rsvpDate > keep.rsvpDate ? "drop" : "keep", rule: "more_recent" };
  return { winner: "keep", rule: "tie_keeps_survivor" };
}

// ── invitations ──────────────────────────────────────────────────────────────────────────────────────────────
/**
 * answered > sent > removed > pending. A removal is an officer's decision not to invite: it is never undone by a
 * merge (it beats a never-sent invitation) but it cannot erase an invitation that already went out or was answered.
 */
const INVITATION_RANK: Record<string, number> = { rsvp_yes: 4, rsvp_no: 4, sent: 3, removed: 2, pending: 1 };
export function pickInvitation(keep: { status: string }, drop: { status: string }): { winner: "keep" | "drop"; rule: "answered_or_sent" | "removal_kept" | "tie_keeps_survivor" } {
  const k = INVITATION_RANK[keep.status] ?? 0, d = INVITATION_RANK[drop.status] ?? 0;
  if (k === d) return { winner: "keep", rule: "tie_keeps_survivor" };
  const winner = d > k ? "drop" : "keep";
  const winning = winner === "drop" ? drop.status : keep.status;
  return { winner, rule: winning === "removed" ? "removal_kept" : "answered_or_sent" };
}

// ── check-ins ────────────────────────────────────────────────────────────────────────────────────────────────
/** The earlier arrival is the check-in; the headcount is the larger of the two (nobody is counted twice). */
export function pickCheckIn(keep: { checkInTime: Date; headcount: number | null }, drop: { checkInTime: Date; headcount: number | null }) {
  return {
    winner: drop.checkInTime < keep.checkInTime ? ("drop" as const) : ("keep" as const),
    headcount: Math.max(keep.headcount ?? 0, drop.headcount ?? 0) || null,
  };
}

// ── RSVP requests ────────────────────────────────────────────────────────────────────────────────────────────
/** A household may have ONE open request per event (database index). Further along beats less far; then the older. */
const REQUEST_RANK: Record<string, number> = { waitlisted: 3, pending: 2, waiting_household_review: 1 };
export interface RequestFacts { id: string; eventId: string; status: string; createdAt: Date }
export type RequestWithdrawRule = "already_attending" | "one_open_request";

/**
 * Which OPEN requests a merge must close. A request is moot when the other record already has an active RSVP for that
 * event; two open requests for one event keep the stronger one. Closed requests are history and simply move.
 */
export function openRequestsToWithdraw(
  keep: RequestFacts[], drop: RequestFacts[], keepAttending: Set<string>, dropAttending: Set<string>,
): { id: string; eventId: string; rule: RequestWithdrawRule }[] {
  const open = (list: RequestFacts[]) => new Map(list.filter((r) => REQUEST_RANK[r.status]).map((r) => [r.eventId, r]));
  const k = open(keep), d = open(drop);
  const out: { id: string; eventId: string; rule: RequestWithdrawRule }[] = [];
  const close = (r: RequestFacts, rule: RequestWithdrawRule) => out.push({ id: r.id, eventId: r.eventId, rule });
  for (const eventId of Array.from(new Set([...Array.from(k.keys()), ...Array.from(d.keys())]))) {
    let a = k.get(eventId), b = d.get(eventId);
    if (a && dropAttending.has(eventId)) { close(a, "already_attending"); a = undefined; }
    if (b && keepAttending.has(eventId)) { close(b, "already_attending"); b = undefined; }
    if (!a || !b) continue;
    const diff = REQUEST_RANK[a.status] - REQUEST_RANK[b.status];
    const keepWins = diff > 0 || (diff === 0 && a.createdAt <= b.createdAt);
    close(keepWins ? b : a, "one_open_request");
  }
  return out;
}

// ── consents ─────────────────────────────────────────────────────────────────────────────────────────────────
export const MERGE_CONSENT_TYPES = ["data_and_contact", "media", "sms", "newsletter"] as const;
export type MergeConsentType = (typeof MERGE_CONSENT_TYPES)[number];
export interface ConsentFacts { type: string; granted: boolean; createdAt: Date }

export function newest(rows: ConsentFacts[], type: string): boolean | null {
  let best: ConsentFacts | null = null;
  for (const r of rows) if (r.type === type && (!best || r.createdAt.getTime() >= best.createdAt.getTime())) best = r;
  return best ? best.granted : null;
}

export interface ConsentResolution {
  type: MergeConsentType;
  keep: boolean | null;
  drop: boolean | null;
  /** The value the newest record across both histories would give. */
  byTime: boolean | null;
  /** Most restrictive: any "no" wins; "yes" only if nobody said no. */
  result: boolean | null;
  conflict: boolean;
  /** The merge appends a refusal (method "merge") because time order alone would have turned a "no" back into a "yes". */
  appendRefusal: boolean;
}

/** Every row is kept (history intact). The EFFECTIVE value is the most restrictive of the two records: a merge never opts a family in. */
export function resolveConsents(keep: ConsentFacts[], drop: ConsentFacts[]): ConsentResolution[] {
  return MERGE_CONSENT_TYPES.map((type) => {
    const k = newest(keep, type), d = newest(drop, type);
    const byTime = newest([...keep, ...drop], type);
    const result = k === false || d === false ? false : k === true || d === true ? true : null;
    return { type, keep: k, drop: d, byTime, result, conflict: k !== null && d !== null && k !== d, appendRefusal: result === false && byTime === true };
  });
}

// ── contact details ──────────────────────────────────────────────────────────────────────────────────────────
export type ContactChoice = "survivor" | "other";

/** The primary email follows the officer's choice (default: the survivor's). The other becomes an alias used only for sign-in matching. */
export function resolveEmail(keepEmail: string | null, dropEmail: string | null, choice: ContactChoice = "survivor") {
  const k = normEmail(keepEmail) || null, d = normEmail(dropEmail) || null;
  if (!k || !d || k === d) return { primary: k ?? d, alias: null as string | null, conflict: false };
  return choice === "other" ? { primary: d, alias: k, conflict: true } : { primary: k, alias: d, conflict: true };
}

export function resolvePhone(keepPhone: string | null, dropPhone: string | null, choice: ContactChoice = "survivor") {
  if (!keepPhone || !dropPhone || keepPhone === dropPhone) return { primary: keepPhone ?? dropPhone, conflict: false };
  return { primary: choice === "other" ? dropPhone : keepPhone, conflict: true };
}

/** Same-set union that keeps first-seen order. */
export const unionList = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));

// ── duplicate detection ──────────────────────────────────────────────────────────────────────────────────────
export type DuplicateReason = "flagged" | "same_email" | "same_phone" | "same_address";
/** addressKey: lib/address addressKey(), the normalized street + ZIP (null = no usable address). */
export interface DupRecord { id: string; email: string | null; phone: string | null; possibleDuplicateOfId: string | null; addressKey?: string | null }
export interface DupPair { aId: string; bId: string; reasons: DuplicateReason[] }

/**
 * Candidate pairs from the records given: the registration flag plus same email (case-insensitive), same phone and same address.
 * Dismissed pairs (keys from pairKey joined with "|") are left out. Three records sharing an address give three pairs.
 */
export function candidatePairs(records: DupRecord[], dismissed: Set<string>): DupPair[] {
  const byId = new Map(records.map((r) => [r.id, r]));
  const found = new Map<string, Set<DuplicateReason>>();
  const add = (x: string, y: string, why: DuplicateReason) => {
    if (x === y || !byId.has(x) || !byId.has(y)) return;
    const [a, b] = pairKey(x, y);
    const key = `${a}|${b}`;
    if (dismissed.has(key)) return;
    (found.get(key) ?? found.set(key, new Set()).get(key)!).add(why);
  };
  for (const r of records) if (r.possibleDuplicateOfId) add(r.id, r.possibleDuplicateOfId, "flagged");
  const group = (valueOf: (r: DupRecord) => string | null, why: DuplicateReason) => {
    const m = new Map<string, string[]>();
    for (const r of records) { const v = valueOf(r); if (v) (m.get(v) ?? m.set(v, []).get(v)!).push(r.id); }
    for (const ids of Array.from(m.values())) for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) add(ids[i], ids[j], why);
  };
  group((r) => normEmail(r.email) || null, "same_email");
  group((r) => r.phone || null, "same_phone");
  group((r) => r.addressKey || null, "same_address");
  return Array.from(found.entries()).map(([key, why]) => { const [aId, bId] = key.split("|"); return { aId, bId, reasons: Array.from(why) }; });
}
