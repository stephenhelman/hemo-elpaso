/**
 * Recorded audio that replaces text-to-speech on the phone line, per prompt and per language. PURE.
 *
 * To use a recording:
 *   1. save it as public/phone-audio/<en|es>/<prompt>.mp3 (prompt ids and the words to read: ./prompts.ts);
 *   2. list the language under that prompt below;
 *   3. run npm run check:phone-prompts (it fails if a listed file is missing), then deploy.
 * Anything not listed here is spoken by text-to-speech. To go back, remove the entry.
 *
 * A recording must say everything the text says: for the voicemail greeting that includes that the message is recorded,
 * to leave out medical details, and to call 911 in an emergency. The "unanswered" prompt reads out the email address.
 * The Twilio-hosted fallback (docs/overhaul/TWILIO_SETUP.md) is separate: change it in the Twilio console.
 */
import type { VoiceLang } from "@/lib/twilio/twiml";
import type { PromptId } from "./prompts";

export type Recorded = Partial<Record<PromptId, readonly VoiceLang[]>>;

/** For example: { welcome: ["en", "es"], voicemail_greeting: ["es"] } */
export const RECORDED: Recorded = {};

/** The address Twilio fetches, relative to the site. */
export const recordingPath = (id: PromptId, lang: VoiceLang) => `/phone-audio/${lang}/${id}.mp3`;
