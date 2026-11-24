/**
 * Fails (exit 1) if a REQUIRED placeholder in the legal text is unresolved while it is used by an always-on section
 * or by a section whose feature toggle is ON. Placeholders live in src/content/legal/meta.ts.
 *
 *   npx tsx scripts/check-legal-placeholders.ts          static: assumes every toggle is OFF (always-on text only)
 *   npx tsx scripts/check-legal-placeholders.ts --db     reads feature_flags (the production build: vercel-build.mjs)
 *
 * With --db, if the toggles cannot be read the check assumes EVERY feature that could be on IS on (fail closed).
 */
import "./_load-env";
import { PLACEHOLDERS, PLACEHOLDER_KEYS, LIVE_POLICY_VERSION } from "../src/content/legal/meta";
import { unitsOf, unresolvedPlaceholders } from "../src/content/legal/analyze";
import { privacy } from "../src/content/legal/privacy";
import { terms } from "../src/content/legal/terms";
import { children } from "../src/content/legal/children";
import { FEATURE_KEYS, canEnable, resolveStates, type FeatureKey } from "../src/lib/features/registry";

async function enabledSet(useDb: boolean): Promise<{ on: Set<FeatureKey>; note: string }> {
  if (!useDb) return { on: new Set(), note: "static (all toggles assumed OFF)" };
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    try {
      const rows = await prisma.featureFlag.findMany({ select: { key: true, enabled: true, enabledAt: true } });
      const st = resolveStates(rows, LIVE_POLICY_VERSION);
      return { on: new Set(FEATURE_KEYS.filter((k) => st[k].enabled)), note: `feature_flags read (${rows.length} row(s))` };
    } finally {
      await prisma.$disconnect();
    }
  } catch (e) {
    const worst = new Set(FEATURE_KEYS.filter((k) => canEnable(k, LIVE_POLICY_VERSION).ok));
    console.error(`[legal-placeholders] could not read feature_flags (${e instanceof Error ? e.name : "error"}); assuming every enable-able feature is ON`);
    return { on: worst, note: "toggles unreadable (fail closed)" };
  }
}

async function main() {
  const { on, note } = await enabledSet(process.argv.includes("--db"));
  const units = [...unitsOf("privacy", privacy), ...unitsOf("terms", terms), ...unitsOf("children", children)];

  console.log(`[legal-placeholders] ${note}; live policy v${LIVE_POLICY_VERSION}`);
  for (const k of PLACEHOLDER_KEYS) {
    const p = PLACEHOLDERS[k];
    const features = Array.from(new Set(units.filter((u) => u.placeholders.includes(k)).flatMap((u) => u.features)));
    console.log(`  {${k}}  ${p.value ? `= "${p.value.en}"` : p.optional ? "unset (optional, omitted)" : "UNRESOLVED"}  used by: ${features.length ? features.join(", ") : "always-on text"}`);
  }

  const bad = unresolvedPlaceholders(units, (k) => on.has(k));
  if (bad.length) {
    console.error(`\n[legal-placeholders] FAILED: unresolved placeholder(s) in live legal text. Set them in src/content/legal/meta.ts or turn the feature off.`);
    for (const b of bad) console.error(`  {${b.placeholder}} in ${b.doc}.${b.lang} (${b.features.join(", ") || "always-on"}): "${b.snippet}…"`);
    process.exit(1);
  }
  console.log("[legal-placeholders] OK");
}
main().catch((e) => { console.error(e); process.exit(1); });
