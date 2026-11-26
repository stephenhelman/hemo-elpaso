/**
 * THE only place TwiML is written (npm run check:twilio-guard). PURE apart from the outbox.
 *
 * Two rules live here so no route can skip them:
 *   - TWILIO_MODE: a number that may not be reached is never put in TwiML; the call says so and moves on.
 *   - Screening: there is no unscreened dial. Every forward asks the person who picks up to press 1 first, so a
 *     personal voicemail can never take a family's call.
 */
import { mayReach, type Reach } from "./mode";
import { holdBack } from "./outbox";

export type VoiceLang = "en" | "es";
const VOICES: Record<VoiceLang, { language: string; voice: string }> = {
  en: { language: "en-US", voice: "Polly.Joanna-Neural" },
  es: { language: "es-US", voice: "Polly.Lupe-Neural" },
};
export type Line = readonly [VoiceLang, string];

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
const attrs = (a: Record<string, string | number>) => Object.entries(a).map(([k, v]) => ` ${k}="${esc(String(v))}"`).join("");
const sayXml = ([lang, text]: Line) => `<Say${attrs(VOICES[lang])}>${esc(text)}</Say>`;

export interface ScreenedDial {
  to: string;
  callerId: string;
  /** Asks the person who picks up to press 1 (runs on their leg only, before the callers are connected). */
  screenPath: string;
  /** Where the caller goes when the dial ends, answered or not. */
  actionPath: string;
  ringSeconds: number;
  maxSeconds: number;
}

export class VoiceTwiml {
  private parts: string[] = [];
  constructor(private readonly reach: Reach) {}

  say(...lines: Line[]) { this.parts.push(...lines.map(sayXml)); return this; }
  hangup() { this.parts.push("<Hangup/>"); return this; }
  redirect(path: string) { this.parts.push(`<Redirect method="POST">${esc(path)}</Redirect>`); return this; }

  /** Collect keypad digits while speaking `lines`. With no input, the call continues with whatever follows. */
  gather(o: { action: string; digits: number; timeoutSeconds: number }, lines: Line[]) {
    this.parts.push(`<Gather${attrs({ input: "dtmf", numDigits: o.digits, timeout: o.timeoutSeconds, action: o.action, method: "POST" })}>${lines.map(sayXml).join("")}</Gather>`);
    return this;
  }

  screenedDial(d: ScreenedDial) {
    if (!mayReach(d.to, this.reach)) {
      holdBack("dial", d.to, this.reach.mode, d.actionPath);
      return this.say(["en", "Test mode. No phone is rung."]).redirect(d.actionPath);
    }
    this.parts.push(
      `<Dial${attrs({ answerOnBridge: "true", callerId: d.callerId, timeout: d.ringSeconds, timeLimit: d.maxSeconds, action: d.actionPath, method: "POST" })}>` +
        `<Number${attrs({ url: d.screenPath, method: "POST" })}>${esc(d.to)}</Number></Dial>`,
    );
    return this;
  }

  toString() { return `<?xml version="1.0" encoding="UTF-8"?><Response>${this.parts.join("")}</Response>`; }
}
