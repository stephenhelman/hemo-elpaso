/**
 * Every change to phone routing, as PURE functions of the current routing (the store applies them under a row lock):
 * unit-tested in scripts/check-phone-routing.ts.
 *
 *   manage  (canManagePhoneRouting, admin@)           add, verify, remove numbers; assign; set hours
 *   swap    (canSwapPhoneDuty, President and VP)      move an option to ANOTHER already-verified board member's number
 *
 * `audit` holds ids and codes only: never a phone number, masked or not.
 */
import { createHash } from "node:crypto";
import {
  CODE_ATTEMPTS, CODE_TTL_MS, MAX_NUMBERS, OPTION_KEYS, checkDutyNumber, checkHours, isOptionKey,
  type NumberError, type OptionKey, type Routing,
} from "./definitions";

export type ChangeAction =
  | "PHONE_NUMBER_ADDED" | "PHONE_NUMBER_REMOVED" | "PHONE_VERIFY_CALL" | "PHONE_NUMBER_VERIFIED" | "PHONE_VERIFY_FAILED"
  | "PHONE_ROUTING_CHANGED" | "PHONE_DUTY_SWAPPED";

/** What the officers are told. Ids only; names and masked numbers are filled in when the email is written. */
export type Notice =
  | { kind: "added" | "verified" | "removed"; ownerId: string; number: string; cleared?: OptionKey[] }
  | { kind: "duty"; option: OptionKey; from: { ownerId: string; number: string } | null; to: { ownerId: string; number: string } | null }
  | { kind: "hours"; option: OptionKey };

export interface Applied {
  ok: true;
  routing: Routing;
  audit: { action: ChangeAction; resourceId: string; changes: Record<string, string | string[] | null> };
  notice: Notice | null;
}
export type ChangeError =
  | NumberError | "not_board_member" | "duplicate" | "too_many" | "unknown_number" | "unknown_option"
  | "not_verified" | "needs_number" | "no_change" | "bad_hours";
export type Change = Applied | { ok: false; error: ChangeError };

const fail = (error: ChangeError) => ({ ok: false, error }) as const;
const clone = (r: Routing): Routing => JSON.parse(JSON.stringify(r));

export const hashCode = (numberId: string, code: string) => createHash("sha256").update(`${numberId}:${code}`).digest("hex");

export function addNumber(r: Routing, i: { id: string; ownerId: unknown; input: unknown; now: Date; boardIds: ReadonlySet<string>; hoep: string | null }): Change {
  if (typeof i.ownerId !== "string" || !i.boardIds.has(i.ownerId)) return fail("not_board_member");
  const n = checkDutyNumber(i.input, i.hoep);
  if (!n.ok) return fail(n.error);
  if (r.numbers.some((x) => x.number === n.number)) return fail("duplicate");
  if (r.numbers.length >= MAX_NUMBERS) return fail("too_many");
  const routing = clone(r);
  routing.numbers.push({ id: i.id, ownerId: i.ownerId, number: n.number, addedAt: i.now.toISOString(), verifiedAt: null, challenge: null });
  return {
    ok: true, routing,
    audit: { action: "PHONE_NUMBER_ADDED", resourceId: i.id, changes: { numberId: i.id, ownerId: i.ownerId } },
    notice: { kind: "added", ownerId: i.ownerId, number: n.number },
  };
}

export function removeNumber(r: Routing, numberId: string): Change {
  const n = r.numbers.find((x) => x.id === numberId);
  if (!n) return fail("unknown_number");
  const routing = clone(r);
  routing.numbers = routing.numbers.filter((x) => x.id !== numberId);
  const cleared = OPTION_KEYS.filter((k) => routing.options[k].numberId === numberId);
  for (const k of cleared) routing.options[k].numberId = null;
  return {
    ok: true, routing,
    audit: { action: "PHONE_NUMBER_REMOVED", resourceId: numberId, changes: { numberId, ownerId: n.ownerId, clearedOptions: cleared } },
    notice: { kind: "removed", ownerId: n.ownerId, number: n.number, cleared },
  };
}

/** A new code for the verification call. An earlier code stops working; an already verified number stays verified. */
export function startChallenge(r: Routing, numberId: string, code: string, now: Date, boardIds: ReadonlySet<string>): Change {
  const n = r.numbers.find((x) => x.id === numberId);
  if (!n) return fail("unknown_number");
  if (!boardIds.has(n.ownerId)) return fail("not_board_member");
  const routing = clone(r);
  routing.numbers.find((x) => x.id === numberId)!.challenge = { hash: hashCode(numberId, code), expiresAt: new Date(now.getTime() + CODE_TTL_MS).toISOString(), attempts: 0 };
  return { ok: true, routing, audit: { action: "PHONE_VERIFY_CALL", resourceId: numberId, changes: { numberId, ownerId: n.ownerId } }, notice: null };
}

export const challengeOpen = (r: Routing, numberId: string, now: Date): boolean => {
  const c = r.numbers.find((x) => x.id === numberId)?.challenge;
  return !!c && c.attempts < CODE_ATTEMPTS && new Date(c.expiresAt) > now;
};

export type CodeOutcome = "verified" | "wrong" | "locked" | "closed";

/** Digits typed on the called phone. "closed" (no code waiting, or expired) changes nothing. */
export function answerChallenge(r: Routing, numberId: string, digits: string, now: Date): { outcome: CodeOutcome; change: Applied | null } {
  if (!challengeOpen(r, numberId, now)) return { outcome: "closed", change: null };
  const routing = clone(r);
  const n = routing.numbers.find((x) => x.id === numberId)!;
  const ids = { numberId, ownerId: n.ownerId };
  if (n.challenge!.hash === hashCode(numberId, digits)) {
    n.verifiedAt = now.toISOString();
    n.challenge = null;
    return { outcome: "verified", change: { ok: true, routing, audit: { action: "PHONE_NUMBER_VERIFIED", resourceId: numberId, changes: ids }, notice: { kind: "verified", ownerId: n.ownerId, number: n.number } } };
  }
  n.challenge!.attempts += 1;
  const locked = n.challenge!.attempts >= CODE_ATTEMPTS;
  if (locked) n.challenge = null;
  return { outcome: locked ? "locked" : "wrong", change: { ok: true, routing, audit: { action: "PHONE_VERIFY_FAILED", resourceId: numberId, changes: ids }, notice: null } };
}

export function assignDuty(r: Routing, option: unknown, numberId: unknown, as: "manage" | "swap", boardIds: ReadonlySet<string>): Change {
  if (!isOptionKey(option)) return fail("unknown_option");
  if (numberId !== null && typeof numberId !== "string") return fail("unknown_number");
  if (numberId === null && as === "swap") return fail("needs_number"); // a swap hands duty to someone; only admin@ can leave it empty
  const to = numberId === null ? null : r.numbers.find((x) => x.id === numberId);
  if (to === undefined) return fail("unknown_number");
  if (to && !to.verifiedAt) return fail("not_verified");
  if (to && !boardIds.has(to.ownerId)) return fail("not_board_member");
  const fromId = r.options[option].numberId;
  if (fromId === numberId) return fail("no_change");
  const from = r.numbers.find((x) => x.id === fromId) ?? null;
  const routing = clone(r);
  routing.options[option].numberId = numberId;
  const who = (n: { ownerId: string; number: string } | null) => (n ? { ownerId: n.ownerId, number: n.number } : null);
  return {
    ok: true, routing,
    audit: {
      action: as === "swap" ? "PHONE_DUTY_SWAPPED" : "PHONE_ROUTING_CHANGED", resourceId: option,
      changes: { option, fromNumberId: from?.id ?? null, fromOwnerId: from?.ownerId ?? null, toNumberId: to?.id ?? null, toOwnerId: to?.ownerId ?? null },
    },
    notice: { kind: "duty", option, from: who(from), to: who(to) },
  };
}

export function setHours(r: Routing, option: unknown, input: unknown): Change {
  if (!isOptionKey(option)) return fail("unknown_option");
  const h = checkHours(input);
  if (!h.ok) return fail("bad_hours");
  if (JSON.stringify(r.options[option].hours) === JSON.stringify(h.hours)) return fail("no_change");
  const routing = clone(r);
  routing.options[option].hours = h.hours;
  return {
    ok: true, routing,
    audit: { action: "PHONE_ROUTING_CHANGED", resourceId: option, changes: { option, hours: h.hours ? `${h.hours.days.join("")} ${h.hours.start}-${h.hours.end}` : "any" } },
    notice: { kind: "hours", option },
  };
}
