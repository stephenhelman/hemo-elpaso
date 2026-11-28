/** What TWILIO_MODE kept from a real phone, oldest first. In memory only; checks read it. */
export interface TwilioOutboxed { at: string; kind: "call" | "dial" | "record"; /** empty for a recording */ to: string; reason: "capture" | "not_allowlisted"; path: string }
type G = typeof globalThis & { __hoepTwilioOutbox?: TwilioOutboxed[] };
const OUTBOX_MAX = 200;

export const twilioOutbox = (): TwilioOutboxed[] => ((globalThis as G).__hoepTwilioOutbox ??= []);
export const clearTwilioOutbox = () => { twilioOutbox().length = 0; };

export function holdBack(kind: TwilioOutboxed["kind"], to: string, mode: string, path: string) {
  const reason = mode === "capture" ? "capture" : "not_allowlisted";
  const box = twilioOutbox();
  box.push({ at: new Date().toISOString(), kind, to, reason, path });
  if (box.length > OUTBOX_MAX) box.splice(0, box.length - OUTBOX_MAX);
  console.log(`[twilio ${reason}] ${kind}`); // never the number
}
