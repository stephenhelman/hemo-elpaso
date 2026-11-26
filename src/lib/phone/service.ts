/** Routing changes as the admin pages and the phone webhooks use them: store the change, then tell the officers. */
import { randomInt, randomUUID } from "node:crypto";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { placeCall } from "@/lib/twilio/client";
import { fallbackNumber, hoepNumber } from "@/lib/twilio/config";
import { addNumber, answerChallenge, assignDuty, challengeOpen, removeNumber, setHours, startChallenge, type Change, type ChangeError, type CodeOutcome } from "./change";
import { CODE_DIGITS, VERIFY_CALL_LIMIT, destinationFor, type OptionKey } from "./definitions";
import { notifyRoutingChange } from "./notify";
import { boardPeople, mutateRouting, readRouting } from "./store";
import { PHONE_PATHS } from "./ivr";

export interface Actor { id: string; name: string }
export type ServiceResult<T = object> = ({ ok: true; noticeSent: boolean } & T) | { ok: false; error: ChangeError | "rate_limited" | "call_failed" | "not_configured" };

async function run(actor: Actor, apply: Parameters<typeof mutateRouting>[1]): Promise<ServiceResult> {
  const r = await mutateRouting({ type: "board", id: actor.id }, apply);
  if (!r.ok) return r;
  const noticeSent = r.notice ? await notifyRoutingChange(r.notice, actor.name, r.people) : true;
  return { ok: true, noticeSent };
}

export const addDutyNumber = (actor: Actor, ownerId: unknown, input: unknown, now = new Date()) =>
  run(actor, (r, boardIds) => addNumber(r, { id: randomUUID(), ownerId, input, now, boardIds, hoep: hoepNumber() }));
export const removeDutyNumber = (actor: Actor, numberId: string) => run(actor, (r) => removeNumber(r, numberId));
export const changeDuty = (actor: Actor, option: unknown, numberId: unknown, as: "manage" | "swap") => run(actor, (r, boardIds) => assignDuty(r, option, numberId, as, boardIds));
export const changeHours = (actor: Actor, option: unknown, hours: unknown) => run(actor, (r) => setHours(r, option, hours));

/**
 * Ring a duty number and ask for a code. The code is shown ONLY to the admin who asked, who tells it to the owner:
 * whoever answers a mistyped number doesn't know it.
 */
export async function startVerification(actor: Actor, numberId: string, now = new Date()): Promise<ServiceResult<{ code: string; captured: boolean }>> {
  const recent = await prisma.auditLog.count({
    where: { action: AuditAction.PHONE_VERIFY_CALL, resourceId: numberId, createdAt: { gte: new Date(now.getTime() - VERIFY_CALL_LIMIT.windowMs) } },
  });
  if (recent >= VERIFY_CALL_LIMIT.max) return { ok: false, error: "rate_limited" };
  const code = String(randomInt(0, 10 ** CODE_DIGITS)).padStart(CODE_DIGITS, "0");
  const r = await mutateRouting({ type: "board", id: actor.id }, (routing, boardIds) => startChallenge(routing, numberId, code, now, boardIds));
  if (!r.ok) return r;
  const number = r.routing.numbers.find((n) => n.id === numberId)!.number;
  const call = await placeCall({ to: number, path: `${PHONE_PATHS.verify}?n=${encodeURIComponent(numberId)}`, maxSeconds: 120 });
  if (!call.ok) return call;
  return { ok: true, noticeSent: true, code, captured: call.captured };
}

/** Is a verification code waiting for this number? (Asked by the webhook before it prompts.) */
export const verificationWaiting = async (numberId: string, now = new Date()) => challengeOpen(await readRouting(), numberId, now);

/** The digits typed on the called phone (webhook). */
export async function confirmVerification(numberId: string, digits: string, now = new Date()): Promise<CodeOutcome> {
  let outcome: CodeOutcome = "closed";
  const r = await mutateRouting({ type: "system", id: null }, (routing): Change => {
    const answer = answerChallenge(routing, numberId, digits, now);
    outcome = answer.outcome;
    return answer.change ?? { ok: false, error: "no_change" };
  });
  if (r.ok && r.notice) await notifyRoutingChange(r.notice, "", r.people);
  return outcome;
}

/**
 * The number to ring for a caller, or null (nobody: the caller hears the "call again" message). If the routing can't be
 * read at all, the fallback number from the environment is rung instead, with the same screening.
 */
export async function numberToRing(option: OptionKey, now = new Date(), load = async () => ({ routing: await readRouting(), people: await boardPeople() })): Promise<string | null> {
  try {
    const { routing, people } = await load();
    const d = destinationFor(routing, option, new Set(people.map((p) => p.id)), now, hoepNumber());
    if (!d.ring) console.log("[phone] nobody to ring", { option, reason: d.reason });
    return d.ring ? d.number : null;
  } catch (e) {
    console.error("[phone] routing unreadable, using the fallback number", { option, error: e instanceof Error ? e.name : "unknown" });
    return fallbackNumber();
  }
}
