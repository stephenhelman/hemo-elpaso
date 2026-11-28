/**
 * What the phone line says. Run: npm run check:phone-prompts   (offline: no database, no Twilio account)
 *  - the organization is said in full in every spoken prompt, including the Twilio-hosted fallback
 *  - the voicemail greeting says it is recorded, to leave out medical details, and to call 911
 *  - a prompt is spoken unless a recorded file is listed for it and its language; every listed file exists
 *  - the fallback text in docs/overhaul/TWILIO_SETUP.md gives the website and the email address in both languages
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { PROMPT_IDS, PROMPT_TEXT, menuLines, prompt, promptText, type PromptId } from "../src/lib/phone/prompts";
import { RECORDED, recordingPath } from "../src/lib/phone/recordings";
import { closed, greeting, screen, screenAnswer, switchedOff, unanswered, verifyAnswer, verifyPrompt, voicemailDone, voicemailPrompt } from "../src/lib/phone/ivr";
import { OPTION_KEYS } from "../src/lib/phone/definitions";
import { VoiceTwiml, type VoiceLang } from "../src/lib/twilio/twiml";
import { reachFrom } from "../src/lib/twilio/mode";

delete process.env.NEXT_PUBLIC_EMAIL_DOMAIN;
const ORG = "Hemophilia Outreach of El Paso";
const ABBREVIATION = /\bH\.?\s?O\.?\s?E\.?\s?P\b/i;
const LANGS: VoiceLang[] = ["en", "es"];
const langsOf = (id: PromptId) => LANGS.filter((l) => l in PROMPT_TEXT[id]);
const live = () => new VoiceTwiml(reachFrom({ TWILIO_MODE: "allowlist" }));

/** Every TwiML document the line can produce. */
function everything(): string[] {
  return [
    greeting(live(), 1), greeting(live(), 2), closed(live()), switchedOff(live(), { to: null, callerId: "+19155550100" }),
    ...OPTION_KEYS.flatMap((o) => [screen(live(), o), screenAnswer(live(), "1", o), unanswered(live(), o), voicemailPrompt(live(), o, true), voicemailPrompt(live(), o, false), voicemailDone(live(), o, "12")]),
    verifyPrompt(live(), "n", true), verifyPrompt(live(), "n", false), verifyAnswer(live(), "n", "verified"), verifyAnswer(live(), "n", "wrong"), verifyAnswer(live(), "n", "locked"),
  ].map((t) => t.toString());
}

test("the organization is always said in full: no abbreviation in any prompt, in either language", () => {
  for (const id of PROMPT_IDS) for (const l of langsOf(id)) assert.ok(!ABBREVIATION.test(promptText(id, l)), `${id}.${l}: ${promptText(id, l)}`);
  for (const xml of everything()) assert.ok(!ABBREVIATION.test(xml), xml);
  for (const id of ["welcome", "screen_events", "screen_spanish", "screen_officer", "verify"] as const) for (const l of LANGS) assert.ok(promptText(id, l).includes(ORG), `${id}.${l}`);
});

test("every prompt the flow uses has its text, and the menu keeps its three choices", () => {
  assert.equal(everything().length, 4 + 6 * 3 + 5);
  assert.deepEqual(menuLines().map(([l, t]) => [l, t.match(/\d/)![0]]), [["en", "1"], ["es", "2"], ["en", "3"], ["es", "3"]]);
  assert.throws(() => promptText("menu_events", "es"), /no es text/);
});

test("voicemail greeting, by menu choice: recorded, no medical details, 911, say name and number, 2 minutes", () => {
  const en = promptText("voicemail_greeting", "en"), es = promptText("voicemail_greeting", "es");
  for (const re of [/will be recorded/, /leave out medical details/, /call 9 1 1/, /name and phone number/, /2 minutes/, /pound key/]) assert.match(en, re);
  for (const re of [/se grabará/, /no incluya detalles médicos/, /llame al 9 1 1/, /número de teléfono/, /2 minutos/, /tecla numeral/]) assert.match(es, re);
  const [events, spanish, officer] = OPTION_KEYS.map((o) => voicemailPrompt(live(), o, true).toString());
  assert.ok(events.includes(en) && !events.includes(es));
  assert.ok(spanish.includes(es) && !spanish.includes(en));
  assert.ok(officer.indexOf(en) >= 0 && officer.indexOf(es) > officer.indexOf(en));
  for (const x of [events, spanish, officer]) assert.ok(x.indexOf("9 1 1") < x.indexOf("<Record "), "all of it is heard before the beep");
});

test("the switched-off notice gives the website and email in both languages", () => {
  for (const s of ["visit hemoelpaso dot org", "info at hemoelpaso dot org", "9 1 1"]) assert.ok(promptText("closed", "en").includes(s), s);
  for (const s of ["visite hemoelpaso punto org", "info arroba hemoelpaso punto org", "9 1 1"]) assert.ok(promptText("closed", "es").includes(s), s);
});

test("text-to-speech unless a recording is listed for that prompt AND language", () => {
  assert.deepEqual(prompt("welcome", "en", {}), ["en", `Thank you for calling ${ORG}.`]);
  const some = { welcome: ["es"] as const };
  assert.equal(prompt("welcome", "en", some)[2], undefined, "the other language is still spoken");
  assert.equal(prompt("welcome", "es", some)[2], "/phone-audio/es/welcome.mp3");
  assert.equal(prompt("goodbye", "es", some)[2], undefined);

  const x = live().say(prompt("welcome", "en", some), prompt("welcome", "es", some)).toString();
  assert.match(x, /<Say language="en-US"[^>]*>Thank you[^<]*<\/Say><Play>\/phone-audio\/es\/welcome\.mp3<\/Play>/);
  for (const bad of ["https://example.com/a.mp3", "/phone-audio/../x.mp3", "/other/en/welcome.mp3", ""]) {
    assert.ok(!live().say(["en", "words", bad]).toString().includes("<Play>"), bad);
  }
});

test("switching a recording on changes the call, with no other code change", () => {
  RECORDED.accept = ["en"];
  try {
    const x = screen(live(), "officer").toString();
    assert.equal(x.match(/<Play>\/phone-audio\/en\/accept\.mp3<\/Play>/g)?.length, 2);
    assert.ok(x.includes("Oprima 1 para contestar.") && !x.includes("Press 1 to accept."));
  } finally { delete RECORDED.accept; }
});

test("every listed recording exists, and no audio file is left unlisted", () => {
  const listed = (Object.entries(RECORDED) as [PromptId, VoiceLang[]][]).flatMap(([id, langs]) => langs.map((l) => {
    assert.ok(PROMPT_IDS.includes(id) && langsOf(id).includes(l), `${id}.${l} is not a prompt`);
    return recordingPath(id, l);
  }));
  for (const p of listed) assert.ok(existsSync(`public${p}`), `listed but missing: public${p}`);
  const files = LANGS.flatMap((l) => (existsSync(`public/phone-audio/${l}`) ? readdirSync(`public/phone-audio/${l}`).filter((f) => !f.startsWith(".")).map((f) => `/phone-audio/${l}/${f}`) : []));
  assert.deepEqual(files.filter((f) => !listed.includes(f)), [], "files in public/phone-audio that nothing plays");
});

test("the Twilio-hosted fallback: both languages give the website and the email, say the name in full, and mention 911", () => {
  const doc = readFileSync("docs/overhaul/TWILIO_SETUP.md", "utf8");
  const bin = /```xml\n([\s\S]*?)```/.exec(doc)?.[1] ?? "";
  const says = Array.from(bin.matchAll(/<Say language="(en-US|es-US)"[^>]*>([\s\S]*?)<\/Say>/g));
  assert.deepEqual(says.map((s) => s[1]), ["en-US", "es-US"]);
  const [en, es] = says.map((s) => s[2]);
  for (const s of [ORG, "visit hemoelpaso dot org", "info at hemoelpaso dot org", "9 1 1"]) assert.ok(en.includes(s), `en: ${s}`);
  for (const s of [ORG, "visite hemoelpaso punto org", "info arroba hemoelpaso punto org", "9 1 1"]) assert.ok(es.includes(s), `es: ${s}`);
  assert.ok(!ABBREVIATION.test(bin) && /<Hangup\/>\s*<\/Response>/.test(bin) && !/<(Dial|Record)/.test(bin));
});
