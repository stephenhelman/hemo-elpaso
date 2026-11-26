/**
 * Feature switchboard runtime: tag-cached reads and the DB-backed toggle deps. Rules live in ./registry and ./change
 * (pure, tested). Never throws on read: if the table is empty or unreadable, everything is OFF.
 */
import { revalidateTag, unstable_cache } from "next/cache";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { LIVE_POLICY_VERSION } from "@/content/legal/meta";
import { notifyOfficersOfAdminAction } from "@/lib/admin-notice";
import { FEATURES, FEATURE_KEYS, resolveStates, type CachedFlagRow, type FeatureKey, type FeatureState, type FlagRow } from "./registry";
import type { ToggleDeps, ToggleRecord } from "./change";
import { placeholdersBlocking, unitsOf } from "@/content/legal/analyze";
import { privacy } from "@/content/legal/privacy";
import { terms } from "@/content/legal/terms";
import { children } from "@/content/legal/children";

export const FEATURES_TAG = "feature-flags";

// Cached as JSON: a cache hit returns `enabledAt` as a string. resolveStates turns it back into a Date.
const readRows = unstable_cache(
  async (): Promise<CachedFlagRow[]> => prisma.featureFlag.findMany({ select: { key: true, enabled: true, enabledAt: true } }),
  ["feature-flags-all"],
  { tags: [FEATURES_TAG], revalidate: 86400 },
);

export async function getFeatureStates(): Promise<Record<FeatureKey, FeatureState>> {
  try {
    return resolveStates(await readRows(), LIVE_POLICY_VERSION);
  } catch (e) {
    console.error("feature flags read failed, all features off", { error: e instanceof Error ? e.name : "unknown" });
    return resolveStates([], LIVE_POLICY_VERSION);
  }
}

/** True only if the toggle is on AND the feature is implemented AND the live policy covers it. */
export async function isFeatureEnabled(key: FeatureKey): Promise<boolean> {
  return (await getFeatureStates())[key].enabled;
}

/** Uncached rows for the admin editor. Throws on DB errors. */
export const readFlagsFresh = (): Promise<FlagRow[]> =>
  prisma.featureFlag.findMany({ select: { key: true, enabled: true, enabledAt: true } });

export const invalidateFeatures = () => revalidateTag(FEATURES_TAG);

async function persist(rec: ToggleRecord): Promise<void> {
  const now = new Date();
  await prisma.$transaction([
    prisma.featureFlag.upsert({
      where: { key: rec.key },
      create: { key: rec.key, enabled: rec.enabled, enabledAt: rec.enabled ? now : null, enabledBy: rec.enabled ? rec.actor.id : null },
      update: { enabled: rec.enabled, enabledAt: rec.enabled ? now : null, enabledBy: rec.enabled ? rec.actor.id : null },
    }),
    prisma.auditLog.create({
      data: {
        patientId: rec.actor.id, action: AuditAction.FEATURE_TOGGLED, resourceType: "FeatureFlag", resourceId: rec.key,
        details: rec.details, changes: { key: rec.key, enabled: rec.enabled, changedBy: rec.actor.name }, actorType: "board",
      },
    }),
  ]);
}

async function notify(rec: ToggleRecord): Promise<boolean> {
  const f = FEATURES[rec.key];
  return notifyOfficersOfAdminAction({
    subjectEn: `Feature ${rec.enabled ? "turned on" : "turned off"}: ${f.label.en}`,
    subjectEs: `Función ${rec.enabled ? "activada" : "desactivada"}: ${f.label.es}`,
    linesEn: [`${rec.actor.name} turned ${rec.enabled ? "ON" : "OFF"} “${f.label.en}” (${rec.key}). The published Privacy Policy now ${rec.enabled ? "shows it as available" : "shows it as not yet available"}.`],
    linesEs: [`${rec.actor.name} ${rec.enabled ? "activó" : "desactivó"} “${f.label.es}” (${rec.key}). La Política de privacidad publicada ahora ${rec.enabled ? "la muestra como disponible" : "la muestra como aún no disponible"}.`],
  });
}

export const toggleDeps = (): ToggleDeps => ({
  liveVersion: LIVE_POLICY_VERSION,
  unresolvedPlaceholders: (key) => placeholdersBlocking([...unitsOf("privacy", privacy), ...unitsOf("terms", terms), ...unitsOf("children", children)], key),
  readEnabled: async (key) => (await prisma.featureFlag.findUnique({ where: { key }, select: { enabled: true } }))?.enabled ?? false,
  persist, invalidate: invalidateFeatures, notifyOfficers: notify,
});

export { FEATURE_KEYS };
