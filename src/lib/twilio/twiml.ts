/**
 * THE only place TwiML is written (npm run check:twilio-guard). PURE apart from the outbox.
 *
 * Three rules live here so no route can skip them:
 *   - TWILIO_MODE: a number that may not be reached is never put in TwiML; the call says so and moves on.
 *   - Screening: there is no unscreened dial. Every forward asks the person who picks up to press 1 first, so a
 *     personal voicemail can never take a family's call. Live calls are never recorded.
 *   - Voicemail: capture mode records nothing; a recording is never transcribed.
 */
import { mayReach, type Reach } from "./mode";
import { holdBack } from "./outbox";

export type VoiceLang = "en" | "es";
const VOICES: Record<VoiceLang, { language: string; voice: string }> = {
  en: { language: "en-US", voice: "Polly.Joanna-Neural" },
  es: { language: "es-US", voice: "Polly.Lupe-Neural" },
};
/** What to say, in which language, and optionally a recorded file (lib/phone/recordings.ts) played instead. */
export type Line = readonly [lang: VoiceLang, text: string, audio?: string];
/** Only the site's own recordings are ever played. */
const AUDIO_PATH = /^\/phone-audio\/(en|es)\/[a-z0-9_]+\.mp3$/;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
const attrs = (a: Record<string, string | number>) => Object.entries(a).map(([k, v]) => ` ${k}="${esc(String(v))}"`).join("");
const sayXml = ([lang, text, audio]: Line) =>
  audio && AUDIO_PATH.test(audio) ? `<Play>${esc(audio)}</Play>` : `<Say${attrs(VOICES[lang])}>${esc(text)}</Say>`;

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

export interface VoicemailRecord {
  /** Where the caller goes when they finish. */
  actionPath: string;
  /** Told when the recording is ready (or that there is none). */
  statusPath: string;
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

  /** Take a message after a beep. Pound ends it, as do silence and the time limit. */
  record(r: VoicemailRecord) {
    if (this.reach.mode === "capture") {
      holdBack("record", "", this.reach.mode, r.actionPath);
      return this.say(["en", "Test mode. No message is recorded."]);
    }
    this.parts.push(
      `<Record${attrs({
        action: r.actionPath, method: "POST", maxLength: r.maxSeconds, timeout: 6, finishOnKey: "#", playBeep: "true", trim: "trim-silence", transcribe: "false",
        recordingStatusCallback: r.statusPath, recordingStatusCallbackMethod: "POST", recordingStatusCallbackEvent: "completed absent",
      })}/>`,
    );
    return this;
  }

  toString() { return `<?xml version="1.0" encoding="UTF-8"?><Response>${this.parts.join("")}</Response>`; }
}
