/**
 * Structured addresses (no database). Run: npm run check:address
 *  - parseAddress: all-empty = none; anything entered needs street, city, state and a 5-digit ZIP; line 2 optional
 *  - ZIP autofill from the BUNDLED table (79901 -> El Paso, TX), no network
 *  - addressKey: the same address typed two ways matches; a text with no street number never does
 *  - the Google script: loaded only by loadGooglePlaces(), never at import; the form asks for suggestions only after
 *    focus and only when the server turned the toggle on; the toggle is off by default
 *  - the "address_autocomplete" policy text is bound to the toggle (EN and ES)
 */
import "./_react-global";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { addressKey, parseAddress, addressColumns } from "../src/lib/address/validate";
import { decodeZip, lookupZip, type ZipData } from "../src/lib/address/zip";
import { US_STATES, DEFAULT_STATE, isStateCode } from "../src/lib/address/states";
import { FEATURES, resolveStates } from "../src/lib/features/registry";
import { privacy } from "../src/content/legal/privacy";

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("parseAddress", () => {
  assert.deepEqual(parseAddress({}), { ok: true, value: null });
  assert.deepEqual(parseAddress({ line1: "", line2: "", city: "", state: "TX", zip: "" }), { ok: true, value: null }, "the pre-selected state alone is not an address");
  assert.deepEqual(parseAddress("123 Main St, El Paso"), { ok: true, value: null }, "a free-text string is not accepted as structured input");
  const good = parseAddress({ line1: " 500  Oregon St ", line2: "Apt 2", city: "El Paso", state: "tx", zip: "79901" });
  assert.deepEqual(good, { ok: true, value: { line1: "500 Oregon St", line2: "Apt 2", city: "El Paso", state: "TX", zip: "79901" } });
  assert.deepEqual(parseAddress({ line1: "1 A St", city: "El Paso", state: "TX", zip: "79901" }), { ok: true, value: { line1: "1 A St", line2: null, city: "El Paso", state: "TX", zip: "79901" } }, "line 2 is optional");
  assert.deepEqual(parseAddress({ city: "El Paso", state: "TX", zip: "79901" }), { ok: false, field: "addressLine1" });
  assert.deepEqual(parseAddress({ line1: "1 A St", state: "TX", zip: "79901" }), { ok: false, field: "city" });
  assert.deepEqual(parseAddress({ line1: "1 A St", city: "X", state: "ZZ", zip: "79901" }), { ok: false, field: "state" });
  assert.deepEqual(parseAddress({ line1: "1 A St", city: "X", state: "Chihuahua", zip: "79901" }), { ok: false, field: "state" }, "no Mexican states");
  for (const zip of ["7990", "799011", "7990a", "79901-1234", ""]) assert.deepEqual(parseAddress({ line1: "1 A St", city: "X", state: "TX", zip }), { ok: false, field: "zip" }, zip);
  assert.deepEqual(addressColumns(null), { addressLine1: null, addressLine2: null, city: null, state: null, zipCode: null });
  assert.equal(addressColumns(good.ok ? good.value : null).zipCode, "79901");
});

test("state list: US states + DC, TX is the default", () => {
  assert.equal(US_STATES.length, 51);
  assert.equal(DEFAULT_STATE, "TX");
  assert.equal(isStateCode("TX"), true);
  assert.equal(isStateCode("CHH"), false);
});

test("ZIP autofill uses the bundled table", async () => {
  const hit = await lookupZip("79901");
  assert.deepEqual(hit, { city: "El Paso", state: "TX" });
  assert.deepEqual(await lookupZip("10001"), { city: "New York", state: "NY" });
  assert.equal(await lookupZip("00000"), null);
  assert.equal(await lookupZip("7990"), null);
  assert.equal(await lookupZip("79901x"), null);
  const tiny: ZipData = { c: ["Town"], s: ["TX", "NM"], z: { "12345": 1 } };
  assert.deepEqual(decodeZip(tiny, "12345"), { city: "Town", state: "NM" });
  // no network: the lookup module and the table contain no URL
  assert.ok(!/https?:\/\//.test(src("src/lib/address/zip.ts")), "zip.ts makes no external call");
  assert.ok(!/fetch\(/.test(src("src/lib/address/zip.ts")));
});

test("addressKey: same address matches however it is typed", () => {
  const a = addressKey({ addressLine1: "500 Oregon Street", addressLine2: "Apartment 2", zipCode: "79901" });
  const b = addressKey({ addressLine1: "500 oregon st.", addressLine2: "Apt 2", zipCode: "79901" });
  assert.ok(a && a === b);
  assert.notEqual(addressKey({ addressLine1: "501 Oregon St", zipCode: "79901" }), addressKey({ addressLine1: "500 Oregon St", zipCode: "79901" }));
  assert.equal(addressKey({ addressLine1: "El Paso", zipCode: "79901" }), null, "no street number: never a match");
  assert.equal(addressKey({ addressLine1: null }), null);
  // a legacy free-text address (everything in line 1) still produces a key
  assert.ok(addressKey({ addressLine1: "500 Oregon St El Paso TX 79901", zipCode: null }));
});

test("autocomplete: off by default, Google script never added unless asked for", async () => {
  assert.equal(FEATURES.address_autocomplete.implemented, true);
  assert.equal(resolveStates([], 2).address_autocomplete.enabled, false, "no stored row: off");
  assert.equal(resolveStates([{ key: "address_autocomplete", enabled: false, enabledAt: null }], 2).address_autocomplete.enabled, false);
  assert.equal(resolveStates([{ key: "address_autocomplete", enabled: true, enabledAt: new Date() }], 2).address_autocomplete.enabled, true, "can be switched on (policy v2 covers it)");

  // the Google URL lives in exactly one place and nothing else loads a script for it
  const google = src("src/lib/address/google.ts");
  assert.equal((google.match(/maps\.googleapis\.com/g) ?? []).length, 1);
  const form = src("src/components/form/AddressFields.tsx");
  assert.ok(!/googleapis|<Script|createElement\("script"\)/.test(form), "AddressFields has no script tag of its own");
  assert.ok(/!autocomplete \|\| !focused/.test(form), "suggestions need the toggle AND focus");
  assert.ok(/onFocus=\{\(\) => setFocused\(true\)\}/.test(form));
  for (const f of ["src/components/register-info/RegisterInfoForm.tsx", "src/app/(public)/portal/PortalEditor.tsx", "src/components/admin/patients/PatientForm.tsx"]) {
    assert.ok(!/PlacesAutocompleteInput|googleapis/.test(src(f)), `${f} does not use the always-on Places input`);
  }

  // behaviour with a fake browser: importing and rendering add nothing; only loadGooglePlaces() adds the script
  process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "test-key";
  const added: string[] = [];
  const g = globalThis as Record<string, unknown>;
  g.window = { google: undefined };
  g.document = { head: { appendChild: (s: { src: string }) => added.push(s.src) }, createElement: () => ({}) };
  const mod = await import("../src/lib/address/google");
  assert.deepEqual(added, [], "import adds no script");
  const React = await import("react");
  const { renderToString } = await import("react-dom/server");
  const { default: AddressFields, emptyAddress } = await import("../src/components/form/AddressFields");
  const html = (autocomplete: boolean) => renderToString(React.createElement(AddressFields, { value: emptyAddress(), onChange: () => {}, locale: "en", autocomplete }));
  assert.ok(!html(false).includes("Google"), "toggle off: no Google line");
  assert.ok(html(true).includes("Address suggestions come from Google."), "toggle on: the line under the field");
  assert.deepEqual(added, [], "rendering (focus never happened) adds no script, even with the toggle on");
  void mod.loadGooglePlaces().catch(() => {});
  assert.equal(added.length, 1, "only an explicit load adds the script");
  assert.ok((added as string[])[0].startsWith("https://maps.googleapis.com/maps/api/js?"));
  delete g.window; delete g.document;
});

test("policy: Google row mentions address suggestions bound to the toggle (EN and ES)", () => {
  const all = JSON.stringify(privacy);
  assert.ok(all.includes("Address suggestions while you type, if enabled. {STATUS:address_autocomplete}"));
  assert.ok(all.includes("Sugerencias de direcciones mientras escribe, si está activado. {STATUS:address_autocomplete}"));
  assert.ok(all.includes("To review new registrations before sending invitations."));
  assert.ok(all.includes("Para revisar los registros nuevos antes de enviar invitaciones."));
});
