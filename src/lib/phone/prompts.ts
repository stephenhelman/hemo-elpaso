/**
 * Everything the phone line says, one entry per prompt and language. Spanish is listed for review in
 * docs/overhaul/ES_REVIEW.md. Nothing here names a condition, a person or an event, and the organization is always said
 * in full (a voice spells an abbreviation out letter by letter). The Spanish prompts keep the English name.
 *
 * A prompt is spoken (text-to-speech) unless ./recordings.ts lists a recorded file for that prompt and language.
 */
import { ORG_NAME } from "@/lib/brand";
import { emailDomain } from "@/lib/site";
import type { Line, VoiceLang } from "@/lib/twilio/twiml";
import { RECORDED, recordingPath, type Recorded } from "./recordings";

/** "hemoelpaso dot org": how an address is read out. */
const spokenDomain = (lang: VoiceLang) => emailDomain().replace(/\./g, lang === "es" ? " punto " : " dot ");
const spokenEmail = (lang: VoiceLang) => `info ${lang === "es" ? "arroba" : "at"} ${spokenDomain(lang)}`;

/** A function where the text depends on a setting. */
type Text = string | (() => string);

export const PROMPT_TEXT = {
  welcome: { en: `Thank you for calling ${ORG_NAME}.`, es: `Gracias por llamar a ${ORG_NAME}.` },
  emergency: { en: "If this is a medical emergency, hang up and call 9 1 1.", es: "Si es una emergencia médica, cuelgue y llame al 9 1 1." },
  // the menu: each choice in the language of the people it is for
  menu_events: { en: "For events in English, press 1." },
  menu_spanish: { es: "Para español, oprima 2." },
  menu_officer: { en: "To speak with an officer, press 3.", es: "Para hablar con un directivo, oprima 3." },
  invalid: { en: "That is not one of the choices.", es: "Esa no es una de las opciones." },
  goodbye: { en: "We did not get your choice. Please call again. Goodbye.", es: "No recibimos su opción. Por favor llame de nuevo. Adiós." },
  // nobody could be reached and no message can be taken
  unanswered: {
    en: () => `We could not connect your call. Please call again later, or email ${spokenEmail("en")}. If this is a medical emergency, call 9 1 1. Goodbye.`,
    es: () => `No pudimos comunicar su llamada. Por favor llame más tarde o escriba a ${spokenEmail("es")}. Si es una emergencia médica, llame al 9 1 1. Adiós.`,
  },
  // the phone system is switched off and nobody can be rung
  closed: {
    en: () => `We cannot take your call right now. Please call again later, visit ${spokenDomain("en")}, or email ${spokenEmail("en")}. If this is a medical emergency, call 9 1 1. Goodbye.`,
    es: () => `En este momento no podemos atender su llamada. Por favor llame más tarde, visite ${spokenDomain("es")} o escriba a ${spokenEmail("es")}. Si es una emergencia médica, llame al 9 1 1. Adiós.`,
  },
  // voicemail: recorded, no medical details, 911; the caller also says their number, in case it is hidden or wrong
  voicemail_greeting: {
    en: "Nobody can answer right now. You may leave a message. It will be recorded. Please leave out medical details. If this is a medical emergency, hang up and call 9 1 1. After the tone, say your name and phone number, then your message. You have up to 2 minutes. When you are done, press the pound key.",
    es: "En este momento nadie puede contestar. Puede dejar un mensaje, que se grabará. Por favor no incluya detalles médicos. Si es una emergencia médica, cuelgue y llame al 9 1 1. Después del tono, diga su nombre y su número de teléfono, y luego su mensaje. Tiene hasta 2 minutos. Cuando termine, oprima la tecla numeral.",
  },
  voicemail_thanks: { en: "Thank you. Your message was recorded. Goodbye.", es: "Gracias. Su mensaje quedó grabado. Adiós." },
  voicemail_none: { en: "We did not get a message. Please call again. Goodbye.", es: "No recibimos ningún mensaje. Por favor llame de nuevo. Adiós." },
  // heard only by the person answering a forwarded call
  screen_events: { en: `A call from ${ORG_NAME}, for the events line.`, es: `Llamada de ${ORG_NAME} para la línea de eventos.` },
  screen_spanish: { en: `A call from ${ORG_NAME}, for the Spanish line.`, es: `Llamada de ${ORG_NAME} para la línea en español.` },
  screen_officer: { en: `A call from ${ORG_NAME}, for an officer.`, es: `Llamada de ${ORG_NAME} para un directivo.` },
  accept: { en: "Press 1 to accept.", es: "Oprima 1 para contestar." },
  connecting: { en: "Connecting.", es: "Comunicando." },
  // confirming a duty number
  verify: {
    en: `This is ${ORG_NAME}, confirming this number for phone duty. Enter the 6 digit code.`,
    es: `Le llama ${ORG_NAME} para confirmar este número de guardia. Marque el código de 6 dígitos.`,
  },
  verified: { en: "Thank you. This number is confirmed. Goodbye.", es: "Gracias. Este número quedó confirmado. Adiós." },
  wrong_code: { en: "That code is not correct.", es: "Ese código no es correcto." },
  not_verified: { en: "This number was not confirmed. Ask for a new call. Goodbye.", es: "Este número no se confirmó. Pida una nueva llamada. Adiós." },
} satisfies Record<string, Partial<Record<VoiceLang, Text>>>;

export type PromptId = keyof typeof PROMPT_TEXT;
export const PROMPT_IDS = Object.keys(PROMPT_TEXT) as PromptId[];

/** The words of one prompt (also what a recording of it must say). */
export function promptText(id: PromptId, lang: VoiceLang): string {
  const text = (PROMPT_TEXT[id] as Partial<Record<VoiceLang, Text>>)[lang];
  if (text === undefined) throw new Error(`no ${lang} text for the phone prompt "${id}"`);
  return typeof text === "function" ? text() : text;
}

/** One prompt in one language: the recorded file when there is one, otherwise the words. */
export const prompt = (id: PromptId, lang: VoiceLang, recorded: Recorded = RECORDED): Line =>
  recorded[id]?.includes(lang) ? [lang, promptText(id, lang), recordingPath(id, lang)] : [lang, promptText(id, lang)];

/** The same prompt in each of these languages, in order. */
export const prompts = (id: PromptId, langs: readonly VoiceLang[]): Line[] => langs.map((l) => prompt(id, l));

export const menuLines = (): Line[] => [prompt("menu_events", "en"), prompt("menu_spanish", "es"), prompt("menu_officer", "en"), prompt("menu_officer", "es")];
