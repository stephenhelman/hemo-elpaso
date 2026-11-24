/**
 * Reads the legal text and reports which paragraphs/bullets/rows use which placeholders and feature status tokens.
 * PURE. Used by scripts/check-legal-placeholders.ts (the production build check) and by the toggle blocker.
 */
import { PLACEHOLDERS, PLACEHOLDER_KEYS, type PlaceholderKey } from "./meta";
import { FEATURE_KEYS, type FeatureKey } from "@/lib/features/registry";
import type { LegalDoc } from "./types";

export interface Unit { doc: string; lang: "en" | "es"; text: string; features: FeatureKey[]; placeholders: PlaceholderKey[] }

export function unitsOf(name: string, doc: LegalDoc): Unit[] {
  const out: Unit[] = [];
  for (const lang of ["en", "es"] as const) {
    const push = (text: string) => {
      const features = FEATURE_KEYS.filter((k) => text.includes(`{STATUS:${k}}`));
      const placeholders = PLACEHOLDER_KEYS.filter((k) => text.includes(`{${k}}`));
      out.push({ doc: name, lang, text, features, placeholders });
    };
    for (const b of doc[lang].blocks) {
      if (b.t === "p") push(b.text);
      else if (b.t === "ul") b.items.forEach(push);
      else if (b.t === "table") b.rows.forEach((r) => push(r.join(" | ")));
    }
  }
  return out;
}

/** All {STATUS:x} tokens in the doc whose key is not a real feature (typos would silently show "Not yet available"). */
export function unknownStatusTokens(name: string, doc: LegalDoc): string[] {
  const bad: string[] = [];
  for (const lang of ["en", "es"] as const) {
    const all = JSON.stringify(doc[lang].blocks);
    for (const m of Array.from(all.matchAll(/\{STATUS:([a-z_]+)\}/g))) if (!(FEATURE_KEYS as readonly string[]).includes(m[1])) bad.push(`${name}.${lang}: ${m[1]}`);
  }
  return bad;
}

export interface Unresolved { placeholder: PlaceholderKey; doc: string; lang: string; features: FeatureKey[]; snippet: string }

/**
 * Required placeholders that are unresolved AND used by an always-on unit or by a unit whose feature is ON.
 * `enabled(key)` says whether a feature toggle is on. `values` can be overridden for tests.
 */
export function unresolvedPlaceholders(units: Unit[], enabled: (k: FeatureKey) => boolean, values: Record<PlaceholderKey, { value: unknown; optional: boolean }> = PLACEHOLDERS): Unresolved[] {
  const out: Unresolved[] = [];
  for (const u of units) {
    const live = u.features.length === 0 || u.features.some(enabled);
    if (!live) continue;
    for (const p of u.placeholders) {
      if (values[p].value === null && !values[p].optional) out.push({ placeholder: p, doc: u.doc, lang: u.lang, features: u.features, snippet: u.text.slice(0, 70) });
    }
  }
  return out;
}

/** Required placeholders that block switching ON this feature (used in its own units). */
export function placeholdersBlocking(units: Unit[], key: FeatureKey): PlaceholderKey[] {
  return Array.from(new Set(unresolvedPlaceholders(units.filter((u) => u.features.includes(key)), () => true).map((u) => u.placeholder)));
}
