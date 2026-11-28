/** Run: npm run check:legal (pure, no DB). Policy content rules: versions, toggle binding, placeholders, consent v3, notices, phone. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PLACEHOLDERS, PLACEHOLDER_KEYS, LIVE_POLICY_VERSION } from "../src/content/legal/meta";
import { placeholdersBlocking, unitsOf, unknownStatusTokens, unresolvedPlaceholders } from "../src/content/legal/analyze";
import { statusLabel } from "../src/content/legal/status";
import { CALL_RECORD_DAYS, VOICEMAIL_RECORD_DAYS, VOICEMAIL_RETENTION_DAYS } from "../src/lib/phone/definitions";
import { privacy } from "../src/content/legal/privacy";
import { terms } from "../src/content/legal/terms";
import { children } from "../src/content/legal/children";
import { FEATURE_KEYS, FEATURES, type FeatureKey } from "../src/lib/features/registry";
import { toggleFeature } from "../src/lib/features/change";

const docs = { privacy, terms, children };
const units = Object.entries(docs).flatMap(([n, d]) => unitsOf(n, d));

test("privacy policy v3 is live; the terms and children's policy are unchanged at v2", () => {
  assert.equal(privacy.version, "3");
  assert.equal(terms.version, "2");
  assert.equal(children.version, "2");
  assert.equal(LIVE_POLICY_VERSION, 3);
  for (const f of Object.values(FEATURES)) assert.ok(f.coveredByPolicy <= 3);
});

test("phone paragraphs, vendor and retention rows: both languages, bound to their switches, and matching the code", () => {
  assert.equal(PLACEHOLDERS.VOICEMAIL_RETENTION.value?.en, `${VOICEMAIL_RETENTION_DAYS} days`);
  assert.equal(PLACEHOLDERS.VOICEMAIL_RETENTION.value?.es, `${VOICEMAIL_RETENTION_DAYS} días`);
  assert.deepEqual([CALL_RECORD_DAYS, VOICEMAIL_RECORD_DAYS], [365, 365], "the policy says 1 year");
  assert.deepEqual(placeholdersBlocking(units, "phone_system"), []);
  const of = (lang: "en" | "es", re: RegExp) => { const u = units.filter((x) => x.doc === "privacy" && x.lang === lang && re.test(x.text)); assert.equal(u.length, 1, `${lang} ${re}`); return u[0]; };
  const statements: [RegExp, RegExp, FeatureKey, RegExp[], RegExp[]][] = [
    [/^\*\*Phone calls\.\*\*/, /^\*\*Llamadas telefónicas\.\*\*/, "phone_system", [/receive your number/, /We don’t record live calls/], [/recibimos su número/, /No grabamos las llamadas en vivo/]],
    [/^\*\*Voicemail\.\*\*/, /^\*\*Mensajes de voz\.\*\*/, "phone_system",
      [/Only the President and Vice President can listen/, /so we can return your call/, /Only the President and Vice President can see your number, and we record each time/, /\{VOICEMAIL_RETENTION\} or sooner/, /don’t transcribe it or attach it to email/, /leave out medical details\. In an emergency, call 911/],
      [/Solo la presidencia y la vicepresidencia pueden escucharla/, /para devolverle la llamada/, /Solo la presidencia y la vicepresidencia pueden ver su número, y anotamos cada vez/, /\{VOICEMAIL_RETENTION\} o antes/, /No la transcribimos ni la adjuntamos/, /no incluya detalles médicos\. En una emergencia, llame al 911/]],
    [/^\*\*Calls from our board\.\*\*/, /^\*\*Llamadas de nuestra junta\.\*\*/, "phone_dialer", [/using HOEP’s number/, /who called, when and the result/], [/usando el número de HOEP/, /quién llamó, cuándo y el resultado/]],
  ];
  for (const [en, es, key, wantEn, wantEs] of statements) {
    for (const [lang, head, want] of [["en", en, wantEn], ["es", es, wantEs]] as const) {
      const u = of(lang, head);
      assert.deepEqual(u.features, [key]);
      for (const re of want) assert.match(u.text, re);
    }
  }
  assert.deepEqual(of("en", /^Twilio \|/).features.sort(), ["phone_dialer", "phone_system", "sms"]);
  assert.deepEqual(of("es", /^Twilio \|/).features.sort(), ["phone_dialer", "phone_system", "sms"]);
  for (const re of [/^Voicemail recordings .*\| No more than \{VOICEMAIL_RETENTION\}/, /^Phone call records .*\| 1 year/]) of("en", re);
  for (const re of [/^Grabaciones de mensajes de voz .*\| No más de \{VOICEMAIL_RETENTION\}/, /^Registros de llamadas .*\| 1 año/]) of("es", re);
  assert.match(of("en", /^\*\*Text messages\.\*\*/).text, /sign-in codes/, "the texting paragraph waits for the texting phase");
});

test("every {STATUS:key} names a real feature; every feature has a privacy section; EN and ES bind the same features", () => {
  for (const [n, d] of Object.entries(docs)) assert.deepEqual(unknownStatusTokens(n, d), [], n);
  const used = (lang: "en" | "es") => new Set(units.filter((u) => u.doc === "privacy" && u.lang === lang).flatMap((u) => u.features));
  for (const k of FEATURE_KEYS) {
    assert.ok(used("en").has(k), `privacy EN binds ${k}`);
    assert.ok(used("es").has(k), `privacy ES binds ${k}`);
  }
  for (const n of Object.keys(docs)) {
    const set = (lang: "en" | "es") => Array.from(new Set(units.filter((u) => u.doc === n && u.lang === lang).flatMap((u) => u.features))).sort();
    assert.deepEqual(set("en"), set("es"), n);
  }
});

test("placeholders: EN and ES use the same ones; unknown {TOKENS} are not left in the text", () => {
  for (const n of Object.keys(docs)) {
    const set = (lang: "en" | "es") => Array.from(new Set(units.filter((u) => u.doc === n && u.lang === lang).flatMap((u) => u.placeholders))).sort();
    assert.deepEqual(set("en"), set("es"), n);
  }
  const known = new Set(["EMAIL", "PHONE", "HOST", ...PLACEHOLDER_KEYS]);
  for (const d of Object.values(docs)) for (const lang of ["en", "es"] as const) {
    for (const m of Array.from(JSON.stringify(d[lang].blocks).matchAll(/\{([A-Z_]+)(?::[a-z_]+)?\}/g))) {
      assert.ok(known.has(m[1]) || m[1] === "STATUS", `unknown token {${m[1]}}`);
    }
  }
});

test("placeholder rule: with every toggle off nothing blocks; with a feature ON its placeholders must be set", () => {
  assert.deepEqual(unresolvedPlaceholders(units, () => false), []);
  assert.deepEqual(unresolvedPlaceholders(units, (k) => k === "live_captions"), []); // TRANSCRIPT is set
  const donations = unresolvedPlaceholders(units, (k) => k === "donations");
  assert.ok(donations.length > 0 && donations.every((u) => u.placeholder === "PROCESSOR"));
  assert.ok(unresolvedPlaceholders(units, (k) => k === "assistance").every((u) => u.placeholder === "ASSISTANCE_RETENTION"));
  assert.deepEqual(placeholdersBlocking(units, "donations"), ["PROCESSOR"]);
  assert.deepEqual(placeholdersBlocking(units, "assistance"), ["ASSISTANCE_RETENTION"]);
  assert.deepEqual(placeholdersBlocking(units, "sms"), []);
});

test("an always-on unresolved placeholder always fails (simulated)", () => {
  const values = { ...PLACEHOLDERS, BACKUP: { value: null, optional: false } } as unknown as typeof PLACEHOLDERS;
  const bad = unresolvedPlaceholders(units, () => false, values);
  assert.ok(bad.some((b) => b.placeholder === "BACKUP"));
  // the optional mailing address never fails
  const noAddr = { ...PLACEHOLDERS, ADDRESS: { value: null, optional: true } } as unknown as typeof PLACEHOLDERS;
  assert.ok(!unresolvedPlaceholders(units, () => false, noAddr).some((b) => b.placeholder === "ADDRESS"));
});

test("defaults: backup window is the existing value, transcripts 90 days, address unset", () => {
  assert.equal(PLACEHOLDERS.BACKUP.value?.en, "up to 14 days");
  assert.equal(PLACEHOLDERS.TRANSCRIPT.value?.en, "90 days");
  assert.equal(PLACEHOLDERS.ADDRESS.value, null);
});

test("status labels: Not yet available / Available since <date>, in both languages", () => {
  assert.equal(statusLabel({ enabled: false, since: null }, "en"), "Not yet available");
  assert.equal(statusLabel(undefined, "es"), "Aún no disponible");
  assert.equal(statusLabel({ enabled: true, since: "2027-03-05" }, "en"), "Available since March 5, 2027");
  assert.equal(statusLabel({ enabled: true, since: "2027-03-05" }, "es"), "Disponible desde 5 de marzo de 2027");
});

test("the legal page, print view and RichText all render statuses from the live toggles", () => {
  const doc = readFileSync("src/components/legal/LegalDocument.tsx", "utf8");
  assert.ok(doc.includes("getFeatureStates()") && doc.includes("statuses={statuses}"));
  assert.ok(readFileSync("src/components/legal/RichText.tsx", "utf8").includes("statusLabel("));
  for (const p of ["privacy", "terms", "children"]) assert.ok(readFileSync(`src/app/(public)/${p}/page.tsx`, "utf8").includes("autoPrint")); // same component = same labels in print
});

test("toggleFeature refuses to enable a feature whose legal placeholders are unresolved", async () => {
  const calls: string[] = [];
  const d = {
    liveVersion: 3, unresolvedPlaceholders: (k: FeatureKey) => (k === "donations" ? ["PROCESSOR"] : []),
    readEnabled: async () => false, persist: async () => { calls.push("persist"); }, invalidate: () => {}, notifyOfficers: async () => true,
  };
  // donations is also "not built", so the placeholder rule is checked with a registry that has it built:
  FEATURES.donations.implemented = true;
  try {
    const r = await toggleFeature(d, "donations", true, { id: "a", name: "A" });
    assert.deepEqual(r, { ok: false, error: "placeholders", placeholders: ["PROCESSOR"] });
    assert.deepEqual(calls, []);
  } finally { FEATURES.donations.implemented = false; }
});

test("the production build runs the placeholder check with the toggles", () => {
  const b = readFileSync("scripts/vercel-build.mjs", "utf8");
  assert.ok(b.includes('"scripts/check-legal-placeholders.ts", "--db"'));
});

// ── Consent v3 ───────────────────────────────────────────────────────────────
import { CONSENT_TEXT_VERSION, consentText, consentTextVersions, eventNotices } from "../src/content/consent";

test("consent v3: version, replaced media text, new sms/newsletter/verification, EN and ES", () => {
  assert.equal(CONSENT_TEXT_VERSION, "v4");
  assert.equal(consentText, consentTextVersions.v4);
  assert.equal(consentTextVersions.v3.media.en, consentText.media.en, "v4 changes nothing but the new guardian text");
  assert.ok(consentText.member_guardian_attestation.en.length > 10 && consentText.member_guardian_attestation.es.length > 10);
  assert.match(consentText.media.en, /recordings and live streams/);
  assert.match(consentText.sms.en, /Reply STOP to stop, HELP for help/);
  assert.match(consentText.newsletter.en, /unsubscribe/);
  assert.match(consentText.verification.en, /President or Vice President/);
  for (const k of ["media", "member_media", "sms", "newsletter", "verification"] as const) {
    assert.ok(consentText[k].en.length > 20 && consentText[k].es.length > 20, k);
    assert.ok(!/DRAFT|BORRADOR/.test(consentText[k].en + consentText[k].es), k);
  }
});

test("consent v3: data/contact and the 18+ attestation carry over from v2 unchanged; v1 and v2 media are untouched", () => {
  const { v2, v3, v1 } = consentTextVersions;
  assert.deepEqual(v3.data_and_contact, v2.data_and_contact);
  assert.deepEqual(v3.age_guardian_attestation, v2.age_guardian_attestation);
  assert.deepEqual(v3.member_data_and_contact, v2.member_data_and_contact);
  assert.deepEqual(v3.member_adult_attestation, v2.member_adult_attestation);
  assert.deepEqual(v2.media, v1.media);
  assert.match(v1.media.en, /^I agree that HOEP may use photos or video that include me or the minors/);
});

test("registration records sms and newsletter consents (append-only rows) and validates them", () => {
  const src = readFileSync("src/lib/patients/create.ts", "utf8");
  assert.ok(src.includes('{ type: "sms", granted: v.consentSms }') && src.includes('{ type: "newsletter", granted: v.consentNewsletter }'));
  assert.ok(src.includes('field: "consentSms"') && src.includes('field: "consentNewsletter"'));
});

test("event notices: quotes always, recording line only for recorded events with the toggle (wired in the event page)", () => {
  assert.match(eventNotices.quotes.en, /without names/);
  assert.match(eventNotices.recorded.en, /recorded and streamed/);
  assert.match(eventNotices.recordedWithCaptions.en, /live English and Spanish captions/);
  const page = readFileSync("src/app/(public)/events/[slug]/page.tsx", "utf8");
  assert.ok(page.includes('event.isRecorded && (await isFeatureEnabled("recordings"))'));
  const form = readFileSync("src/components/rsvp/RsvpModal.tsx", "utf8");
  assert.ok(form.includes("notices.recorded") && form.includes("eventNotices.quotes"));
});

test("only canManageEvents holders can set the recorded flag (event routes are gated)", () => {
  for (const f of ["src/app/api/admin/events/route.ts", "src/app/api/admin/events/[id]/route.ts"]) {
    assert.ok(readFileSync(f, "utf8").includes('requirePermission("canManageEvents")'), f);
  }
});
