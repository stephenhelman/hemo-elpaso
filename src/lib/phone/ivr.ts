/**
 * The call flow, as TwiML. PURE apart from the TwiML outbox: unit-tested in scripts/check-phone-routing.ts.
 *
 *   /voice                      greeting and menu (twice, then goodbye)
 *   /voice/menu                 the choice: ring the person on duty, with screening, or go to voicemail
 *   /voice/screen               on the answering phone only: "press 1 to accept"; anything else hangs up that leg
 *   /voice/dial-result          after the dial: nothing more if the two were connected, else voicemail
 *   /voice/voicemail            the voicemail greeting and the beep, or "call again" when no message can be taken
 *   /voice/voicemail/done       thanks, after the caller finishes
 *   /voice/voicemail/recording  the provider reports the recording (lib/phone/voicemail.ts)
 *   /voice/verify               the call that confirms a duty number with a code
 *
 * Voicemail is reached only by a redirect, so a caller who has already hung up never uses up their daily allowance.
 * Query strings carry codes and ids only. Live calls are never recorded.
 */
import type { VoiceLang, VoiceTwiml } from "@/lib/twilio/twiml";
import { CODE_DIGITS, MAX_CALL_SECONDS, OPTIONS, RING_SECONDS, VOICEMAIL_MAX_SECONDS, VOICEMAIL_MIN_SECONDS, optionForDigit, type OptionKey } from "./definitions";
import type { CodeOutcome } from "./change";
import { menuLines, prompts } from "./prompts";

export const PHONE_PATHS = {
  voice: "/api/twilio/voice",
  menu: "/api/twilio/voice/menu",
  screen: "/api/twilio/voice/screen",
  accept: "/api/twilio/voice/screen/accept",
  dialResult: "/api/twilio/voice/dial-result",
  voicemail: "/api/twilio/voice/voicemail",
  voicemailDone: "/api/twilio/voice/voicemail/done",
  recording: "/api/twilio/voice/voicemail/recording",
  verify: "/api/twilio/voice/verify",
  confirm: "/api/twilio/voice/verify/confirm",
} as const;

export const MENU_TRIES = 2;
const BOTH: readonly VoiceLang[] = ["en", "es"];

/** The "try" number from a query string: 1 or 2. */
export const attemptFrom = (v: string | null): number => Math.min(MENU_TRIES, Math.max(1, Number(v) || 1));

export function greeting(tw: VoiceTwiml, attempt: number): VoiceTwiml {
  const intro = attempt === 1 ? [...prompts("welcome", BOTH), ...prompts("emergency", BOTH)] : [];
  tw.gather({ action: `${PHONE_PATHS.menu}?try=${attempt}`, digits: 1, timeoutSeconds: 6 }, [...intro, ...menuLines()]);
  // reached only when nothing was pressed
  if (attempt < MENU_TRIES) return tw.redirect(`${PHONE_PATHS.voice}?try=${attempt + 1}`);
  return tw.say(...prompts("goodbye", BOTH)).hangup();
}

/** Nobody could be reached and no message can be taken. */
export function unanswered(tw: VoiceTwiml, option: OptionKey): VoiceTwiml {
  return tw.say(...prompts("unanswered", OPTIONS[option].languages)).hangup();
}

export const toVoicemail = (tw: VoiceTwiml, option: OptionKey): VoiceTwiml => tw.redirect(`${PHONE_PATHS.voicemail}?o=${option}`);

/** `record` is lib/phone/voicemail.ts's answer: false when the caller is over a limit or voicemail can't work. */
export function voicemailPrompt(tw: VoiceTwiml, option: OptionKey, record: boolean): VoiceTwiml {
  if (!record) return unanswered(tw, option);
  const langs = OPTIONS[option].languages;
  return tw
    .say(...prompts("voicemail_greeting", langs))
    .record({ actionPath: `${PHONE_PATHS.voicemailDone}?o=${option}`, statusPath: `${PHONE_PATHS.recording}?o=${option}`, maxSeconds: VOICEMAIL_MAX_SECONDS })
    .say(...prompts("voicemail_none", langs)) // reached only if nothing was recorded
    .hangup();
}

/** After the recording. `seconds` is what the provider says was recorded; too little is not called a message. */
export function voicemailDone(tw: VoiceTwiml, option: OptionKey, seconds: string | undefined): VoiceTwiml {
  const nothing = !!seconds && Number(seconds) >= 0 && Number(seconds) < VOICEMAIL_MIN_SECONDS;
  return tw.say(...prompts(nothing ? "voicemail_none" : "voicemail_thanks", OPTIONS[option].languages)).hangup();
}

export async function menuChoice(
  tw: VoiceTwiml, digit: string | undefined, attempt: number,
  deps: { numberFor: (o: OptionKey) => Promise<string | null>; callerId: string },
): Promise<VoiceTwiml> {
  const option = optionForDigit(digit);
  if (!option) {
    tw.say(...prompts("invalid", BOTH));
    return attempt < MENU_TRIES ? tw.redirect(`${PHONE_PATHS.voice}?try=${attempt + 1}`) : tw.say(...prompts("goodbye", BOTH)).hangup();
  }
  const to = await deps.numberFor(option);
  if (!to) return toVoicemail(tw, option);
  return tw.screenedDial({
    to, callerId: deps.callerId, ringSeconds: RING_SECONDS, maxSeconds: MAX_CALL_SECONDS,
    screenPath: `${PHONE_PATHS.screen}?o=${option}`, actionPath: `${PHONE_PATHS.dialResult}?o=${option}`,
  });
}

/** Played to whoever picked up. A voicemail greeting presses nothing, so the leg is hung up and the caller moves on. */
export function screen(tw: VoiceTwiml, option: OptionKey): VoiceTwiml {
  const langs = OPTIONS[option].languages;
  const ask = [...prompts(`screen_${option}`, langs), ...prompts("accept", langs)];
  return tw.gather({ action: `${PHONE_PATHS.accept}?o=${option}`, digits: 1, timeoutSeconds: 8 }, [...ask, ...ask]).hangup();
}

/** "1" ends the screening TwiML without hanging up, which connects the two. Anything else refuses the call. */
export function screenAnswer(tw: VoiceTwiml, digit: string | undefined, option: OptionKey): VoiceTwiml {
  return digit === "1" ? tw.say(...prompts("connecting", OPTIONS[option].languages)) : tw.hangup();
}

/**
 * Did the caller talk to someone? ONLY DialBridged says so. A phone answered without pressing 1 (a personal voicemail)
 * still reports the dialled leg as answered/completed, and the parent call's own status says nothing about it either:
 * neither CallStatus nor DialCallStatus alone may be trusted here.
 */
export const dialConnected = (params: Record<string, string>): boolean => params.DialBridged === "true";

export function dialResult(tw: VoiceTwiml, params: Record<string, string>, option: OptionKey): VoiceTwiml {
  return dialConnected(params) ? tw.hangup() : toVoicemail(tw, option);
}

export function verifyPrompt(tw: VoiceTwiml, numberId: string, waiting: boolean): VoiceTwiml {
  if (!waiting) return tw.say(...prompts("not_verified", BOTH)).hangup();
  return tw
    .gather({ action: `${PHONE_PATHS.confirm}?n=${encodeURIComponent(numberId)}`, digits: CODE_DIGITS, timeoutSeconds: 15 }, prompts("verify", BOTH))
    .hangup();
}

export function verifyAnswer(tw: VoiceTwiml, numberId: string, outcome: CodeOutcome): VoiceTwiml {
  if (outcome === "verified") return tw.say(...prompts("verified", BOTH)).hangup();
  if (outcome === "wrong") return tw.say(...prompts("wrong_code", BOTH)).redirect(`${PHONE_PATHS.verify}?n=${encodeURIComponent(numberId)}`);
  return tw.say(...prompts("not_verified", BOTH)).hangup();
}
