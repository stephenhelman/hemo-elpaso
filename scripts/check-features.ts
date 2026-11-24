/** Run: npm run check:features (pure, no DB). The feature switchboard rules. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { FEATURES, FEATURE_KEYS, canEnable, lockText, resolveStates, type FeatureDef, type FeatureKey } from "../src/lib/features/registry";
import { toggleFeature } from "../src/lib/features/change";

const POLICY_KEYS = ["recordings", "live_captions", "family_portal", "family_social_signin", "verification", "sms", "newsletter", "stories", "assistance", "live_interaction", "community", "donations", "volunteers"];
const actor = { id: "a", name: "Admin" };
const withFeature = (patch: Partial<FeatureDef>): Record<FeatureKey, FeatureDef> => ({ ...FEATURES, sms: { ...FEATURES.sms, ...patch } });

test("registry keys are exactly the policy's Feature status toggle keys", () => {
  assert.deepEqual([...FEATURE_KEYS].sort(), [...POLICY_KEYS].sort());
  const draft = readFileSync("docs/legal/POLICY_V2_DRAFT.md", "utf8");
  for (const k of FEATURE_KEYS) assert.ok(draft.includes("`" + k + "`"), k);
});

test("nothing is implemented yet, so nothing can be switched on", () => {
  for (const k of FEATURE_KEYS) {
    assert.equal(FEATURES[k].implemented, false, k);
    assert.deepEqual(canEnable(k, 99), { ok: false, reason: "not_built" });
  }
});

test("on only if implemented AND the live policy covers it", () => {
  assert.deepEqual(canEnable("sms", 1, withFeature({ implemented: true, coveredByPolicy: 2 })), { ok: false, reason: "needs_policy", version: 2 });
  assert.deepEqual(canEnable("sms", 2, withFeature({ implemented: true, coveredByPolicy: 2 })), { ok: true });
  assert.deepEqual(canEnable("sms", 2, withFeature({ implemented: false, coveredByPolicy: 2 })), { ok: false, reason: "not_built" });
  assert.equal(lockText({ ok: false, reason: "not_built" }, "en"), "Not built yet");
  assert.equal(lockText({ ok: false, reason: "needs_policy", version: 2 }, "en"), "Requires policy v2");
  assert.equal(lockText({ ok: true }, "en"), null);
});

test("a stored ON row never turns on a feature that is locked; everything defaults off", () => {
  const rows = [{ key: "sms", enabled: true, enabledAt: new Date() }];
  assert.equal(resolveStates(rows, 2).sms.enabled, false);
  assert.equal(resolveStates(rows, 2, withFeature({ implemented: true })).sms.enabled, true);
  assert.equal(resolveStates(rows, 1, withFeature({ implemented: true })).sms.enabled, false);
  for (const k of FEATURE_KEYS) assert.equal(resolveStates([], 2)[k].enabled, false);
  assert.equal(resolveStates(null, 2).sms.enabledAt, null);
});

function deps(live: number, current = false) {
  const calls: string[] = [];
  return { calls, d: {
    liveVersion: live, readEnabled: async () => current,
    persist: async () => { calls.push("persist"); }, invalidate: () => { calls.push("invalidate"); },
    notifyOfficers: async () => { calls.push("notify"); return true; },
  } };
}

test("toggleFeature refuses to enable a locked feature, with no side effects", async () => {
  const { calls, d } = deps(2);
  const r = await toggleFeature(d, "sms", true, actor);
  assert.equal(r.ok, false);
  assert.deepEqual(calls, []);
});

test("toggleFeature: turning OFF is always allowed, and writes + invalidates + notifies", async () => {
  const { calls, d } = deps(1, true);
  const r = await toggleFeature(d, "sms", false, actor);
  assert.equal(r.ok && r.changed, true);
  assert.deepEqual(calls, ["persist", "invalidate", "notify"]);
  const same = deps(1, false);
  assert.deepEqual(await toggleFeature(same.d, "sms", false, actor), { ok: true, changed: false });
  assert.deepEqual(same.calls, []);
});

test("the features API is gated by canManageFeatureToggles first", () => {
  const src = readFileSync("src/app/api/admin/settings/features/route.ts", "utf8");
  for (const h of Array.from(src.matchAll(/export async function (GET|PUT)\(/g))) {
    assert.ok(src.slice(h.index!).indexOf('requirePermission("canManageFeatureToggles")') < 200, h[1]);
  }
});
