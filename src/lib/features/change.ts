/** Toggling a feature: check it may be enabled, save + audit, drop the cache, tell the officers. Side effects injected. */
import { FEATURES, canEnable, type EnableCheck, type FeatureKey } from "./registry";

export interface Actor { id: string; name: string }
export interface ToggleRecord { key: FeatureKey; enabled: boolean; actor: Actor; details: string }

export interface ToggleDeps {
  liveVersion: number;
  /** Required legal placeholders (src/content/legal/meta.ts) still unresolved for this feature; enabling is refused while any remain. */
  unresolvedPlaceholders?: (key: FeatureKey) => string[];
  readEnabled: (key: FeatureKey) => Promise<boolean>;
  persist: (rec: ToggleRecord) => Promise<void>; // row + audit entry in one transaction
  invalidate: () => void;
  notifyOfficers: (rec: ToggleRecord) => Promise<boolean>;
}

export type ToggleResult =
  | { ok: true; changed: false }
  | { ok: true; changed: true; noticeSent: boolean }
  | { ok: false; error: "locked"; check: Exclude<EnableCheck, { ok: true }> }
  | { ok: false; error: "placeholders"; placeholders: string[] };

export async function toggleFeature(deps: ToggleDeps, key: FeatureKey, enabled: boolean, actor: Actor): Promise<ToggleResult> {
  if (enabled) {
    const check = canEnable(key, deps.liveVersion);
    if (!check.ok) return { ok: false, error: "locked", check };
    const open = deps.unresolvedPlaceholders?.(key) ?? [];
    if (open.length) return { ok: false, error: "placeholders", placeholders: open };
  }
  if ((await deps.readEnabled(key)) === enabled) return { ok: true, changed: false };

  const rec: ToggleRecord = { key, enabled, actor, details: `Feature "${key}" (${FEATURES[key].label.en}) turned ${enabled ? "ON" : "OFF"} by ${actor.name}` };
  await deps.persist(rec);
  deps.invalidate();
  let noticeSent = false;
  try { noticeSent = await deps.notifyOfficers(rec); } catch { noticeSent = false; }
  return { ok: true, changed: true, noticeSent };
}
