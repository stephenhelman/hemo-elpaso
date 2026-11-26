/**
 * The call flow, as TwiML. PURE apart from the TwiML outbox: unit-tested in scripts/check-phone-routing.ts.
 *
 *   /voice           greeting and menu (twice, then goodbye)
 *   /voice/menu      the choice: ring the person on duty, with screening, or say nobody could be reached
 *   /voice/screen    on the answering phone only: "press 1 to accept"; anything else hangs up that leg
 *   /voice/dial-result  after the dial: nothing more if the two were connected, else the "call again" message
 *   /voice/verify    the call that confirms a duty number with a code
 *
 * Query strings carry codes and ids only. No calls are recorded. unanswered() is where voicemail will go.
 */
import type { Line, VoiceLang, VoiceTwiml } from "@/lib/twilio/twiml";
import { CODE_DIGITS, MAX_CALL_SECONDS, OPTIONS, RING_SECONDS, optionForDigit, type OptionKey } from "./definitions";
import type { CodeOutcome } from "./change";
import { MENU, PROMPTS } from "./prompts";

export const PHONE_PATHS = {
  voice: "/api/twilio/voice",
  menu: "/api/twilio/voice/menu",
  screen: "/api/twilio/voice/screen",
  accept: "/api/twilio/voice/screen/accept",
  dialResult: "/api/twilio/voice/dial-result",
  verify: "/api/twilio/voice/verify",
  confirm: "/api/twilio/voice/verify/confirm",
} as const;

export const MENU_TRIES = 2;
const BOTH: readonly VoiceLang[] = ["en", "es"];
const each = (langs: readonly VoiceLang[], text: (l: VoiceLang) => string): Line[] => langs.map((l) => [l, text(l)] as const);

/** The "try" number from a query string: 1 or 2. */
export const attemptFrom = (v: string | null): number => Math.min(MENU_TRIES, Math.max(1, Number(v) || 1));

export function greeting(tw: VoiceTwiml, attempt: number): VoiceTwiml {
  const intro = attempt === 1 ? [...each(BOTH, (l) => PROMPTS[l].welcome), ...each(BOTH, (l) => PROMPTS[l].emergency)] : [];
  tw.gather({ action: `${PHONE_PATHS.menu}?try=${attempt}`, digits: 1, timeoutSeconds: 6 }, [...intro, ...MENU]);
  // reached only when nothing was pressed
  if (attempt < MENU_TRIES) return tw.redirect(`${PHONE_PATHS.voice}?try=${attempt + 1}`);
  return tw.say(...each(BOTH, (l) => PROMPTS[l].goodbye)).hangup();
}

export function unanswered(tw: VoiceTwiml, option: OptionKey): VoiceTwiml {
  return tw.say(...each(OPTIONS[option].languages, (l) => PROMPTS[l].unanswered())).hangup();
}

export async function menuChoice(
  tw: VoiceTwiml, digit: string | undefined, attempt: number,
  deps: { numberFor: (o: OptionKey) => Promise<string | null>; callerId: string },
): Promise<VoiceTwiml> {
  const option = optionForDigit(digit);
  if (!option) {
    tw.say(...each(BOTH, (l) => PROMPTS[l].invalid));
    return attempt < MENU_TRIES ? tw.redirect(`${PHONE_PATHS.voice}?try=${attempt + 1}`) : tw.say(...each(BOTH, (l) => PROMPTS[l].goodbye)).hangup();
  }
  const to = await deps.numberFor(option);
  if (!to) return unanswered(tw, option);
  return tw.screenedDial({
    to, callerId: deps.callerId, ringSeconds: RING_SECONDS, maxSeconds: MAX_CALL_SECONDS,
    screenPath: `${PHONE_PATHS.screen}?o=${option}`, actionPath: `${PHONE_PATHS.dialResult}?o=${option}`,
  });
}

/** Played to whoever picked up. A voicemail greeting presses nothing, so the leg is hung up and the caller moves on. */
export function screen(tw: VoiceTwiml, option: OptionKey): VoiceTwiml {
  const langs = OPTIONS[option].languages;
  const ask = [...each(langs, (l) => PROMPTS[l].screen[option]), ...each(langs, (l) => PROMPTS[l].accept)];
  return tw.gather({ action: `${PHONE_PATHS.accept}?o=${option}`, digits: 1, timeoutSeconds: 8 }, [...ask, ...ask]).hangup();
}

/** "1" ends the screening TwiML without hanging up, which connects the two. Anything else refuses the call. */
export function screenAnswer(tw: VoiceTwiml, digit: string | undefined, option: OptionKey): VoiceTwiml {
  return digit === "1" ? tw.say(...each(OPTIONS[option].languages, (l) => PROMPTS[l].connecting)) : tw.hangup();
}

/** `bridged` is Twilio's DialBridged: only then did the caller talk to someone. A refused screening is not bridged. */
export function dialResult(tw: VoiceTwiml, bridged: boolean, option: OptionKey): VoiceTwiml {
  return bridged ? tw.hangup() : unanswered(tw, option);
}

export function verifyPrompt(tw: VoiceTwiml, numberId: string, waiting: boolean): VoiceTwiml {
  if (!waiting) return tw.say(...each(BOTH, (l) => PROMPTS[l].notVerified)).hangup();
  return tw
    .gather({ action: `${PHONE_PATHS.confirm}?n=${encodeURIComponent(numberId)}`, digits: CODE_DIGITS, timeoutSeconds: 15 }, each(BOTH, (l) => PROMPTS[l].verify))
    .hangup();
}

export function verifyAnswer(tw: VoiceTwiml, numberId: string, outcome: CodeOutcome): VoiceTwiml {
  if (outcome === "verified") return tw.say(...each(BOTH, (l) => PROMPTS[l].verified)).hangup();
  if (outcome === "wrong") return tw.say(...each(BOTH, (l) => PROMPTS[l].wrongCode)).redirect(`${PHONE_PATHS.verify}?n=${encodeURIComponent(numberId)}`);
  return tw.say(...each(BOTH, (l) => PROMPTS[l].notVerified)).hangup();
}
