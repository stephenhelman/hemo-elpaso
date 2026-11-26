/**
 * Everything the phone line says. Spanish is listed for review in docs/overhaul/ES_REVIEW.md. Nothing here names a
 * condition, a person or an event.
 */
import { emailDomain } from "@/lib/site";
import type { Line, VoiceLang } from "@/lib/twilio/twiml";
import type { OptionKey } from "./definitions";

/** "info at hemoelpaso dot org": how an address is read out. */
const spokenEmail = (lang: VoiceLang) => `info ${lang === "es" ? "arroba" : "at"} ${emailDomain().replace(/\./g, lang === "es" ? " punto " : " dot ")}`;

export const PROMPTS = {
  en: {
    welcome: "Thank you for calling Hemophilia Outreach of El Paso.",
    emergency: "If this is a medical emergency, hang up and call 9 1 1.",
    invalid: "That is not one of the choices.",
    goodbye: "We did not get your choice. Please call again. Goodbye.",
    unanswered: () => `We could not connect your call. Please call again later, or email ${spokenEmail("en")}. If this is a medical emergency, call 9 1 1. Goodbye.`,
    connecting: "Connecting.",
    screen: { events: "H O E P call for the events line.", spanish: "H O E P call for the Spanish line.", officer: "H O E P call for an officer." } as Record<OptionKey, string>,
    accept: "Press 1 to accept.",
    verify: "This is H O E P, confirming this number for phone duty. Enter the 6 digit code.",
    verified: "Thank you. This number is confirmed. Goodbye.",
    wrongCode: "That code is not correct.",
    notVerified: "This number was not confirmed. Ask for a new call. Goodbye.",
  },
  es: {
    welcome: "Gracias por llamar a Hemophilia Outreach of El Paso.",
    emergency: "Si es una emergencia médica, cuelgue y llame al 9 1 1.",
    invalid: "Esa no es una de las opciones.",
    goodbye: "No recibimos su opción. Por favor llame de nuevo. Adiós.",
    unanswered: () => `No pudimos comunicar su llamada. Por favor llame más tarde o escriba a ${spokenEmail("es")}. Si es una emergencia médica, llame al 9 1 1. Adiós.`,
    connecting: "Comunicando.",
    screen: { events: "Llamada de H O E P para la línea de eventos.", spanish: "Llamada de H O E P para la línea en español.", officer: "Llamada de H O E P para un directivo." } as Record<OptionKey, string>,
    accept: "Oprima 1 para contestar.",
    verify: "Le llama H O E P para confirmar este número de guardia. Marque el código de 6 dígitos.",
    verified: "Gracias. Este número quedó confirmado. Adiós.",
    wrongCode: "Ese código no es correcto.",
    notVerified: "Este número no se confirmó. Pida una nueva llamada. Adiós.",
  },
} as const;

/** The menu, each choice in the language of the people it is for. */
export const MENU: Line[] = [
  ["en", "For events in English, press 1."],
  ["es", "Para español, oprima 2."],
  ["en", "To speak with an officer, press 3."],
  ["es", "Para hablar con un directivo, oprima 3."],
];
