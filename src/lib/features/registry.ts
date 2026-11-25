/**
 * Feature registry: the switchboard's code side. PURE (no DB, no Next).
 *
 * `family_social_signin` was folded into `family_portal` (family sign-in is Google, Apple or Facebook only). The key is
 * retired, not reserved for anything: a stored feature_flags row for it is ignored. A future text-code sign-in would be a
 * new key with its own policy text.
 *
 * Keys are the toggle keys of the policy's "Feature status" table (docs/legal/POLICY_V2_DRAFT.md). Features that are
 * always on (registration, photos, contact form) are NOT toggles.
 *
 *   implemented          the feature's code exists. Flip to true in the PR that ships the feature.
 *   coveredByPolicy      the first policy version whose text describes the feature.
 *
 * A toggle can be switched ON only if implemented AND coveredByPolicy <= the live policy version. Otherwise it shows
 * locked with the reason. Switching OFF is always allowed.
 */
export const FEATURE_KEYS = [
  "recordings", "live_captions", "family_portal", "verification", "sms", "newsletter",
  "stories", "assistance", "live_interaction", "community", "donations", "volunteers", "address_autocomplete",
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];
export const isFeatureKey = (k: unknown): k is FeatureKey => typeof k === "string" && (FEATURE_KEYS as readonly string[]).includes(k);

export interface FeatureDef {
  key: FeatureKey;
  implemented: boolean;
  coveredByPolicy: number;
  label: { en: string; es: string };
}

export const FEATURES: Record<FeatureKey, FeatureDef> = {
  recordings: { key: "recordings", implemented: false, coveredByPolicy: 2, label: { en: "Event recordings and live streams", es: "Grabaciones y transmisiones en vivo de eventos" } },
  live_captions: { key: "live_captions", implemented: false, coveredByPolicy: 2, label: { en: "Live captions and translation (Puente Live)", es: "Subtítulos y traducción en vivo (Puente Live)" } },
  family_portal: { key: "family_portal", implemented: true, coveredByPolicy: 2, label: { en: "Family page (sign in with Google, Apple or Facebook)", es: "Página familiar (inicio de sesión con Google, Apple o Facebook)" } },
  verification: { key: "verification", implemented: false, coveredByPolicy: 2, label: { en: "Diagnosis verification", es: "Verificación de diagnóstico" } },
  sms: { key: "sms", implemented: false, coveredByPolicy: 2, label: { en: "Text messages", es: "Mensajes de texto" } },
  newsletter: { key: "newsletter", implemented: false, coveredByPolicy: 2, label: { en: "Newsletter", es: "Boletín" } },
  stories: { key: "stories", implemented: false, coveredByPolicy: 2, label: { en: "Patient stories and blog", es: "Historias de pacientes y blog" } },
  assistance: { key: "assistance", implemented: false, coveredByPolicy: 2, label: { en: "Financial assistance and scholarships", es: "Ayuda financiera y becas" } },
  live_interaction: { key: "live_interaction", implemented: false, coveredByPolicy: 2, label: { en: "Polls and questions at events", es: "Encuestas y preguntas en eventos" } },
  community: { key: "community", implemented: false, coveredByPolicy: 2, label: { en: "Community Q&A", es: "Preguntas y respuestas de la comunidad" } },
  donations: { key: "donations", implemented: false, coveredByPolicy: 2, label: { en: "Online donations", es: "Donaciones en línea" } },
  address_autocomplete: { key: "address_autocomplete", implemented: true, coveredByPolicy: 2, label: { en: "Address suggestions while you type (Google)", es: "Sugerencias de direcciones mientras escribe (Google)" } },
  volunteers: { key: "volunteers", implemented: false, coveredByPolicy: 2, label: { en: "Volunteer sign-up", es: "Registro de voluntarios" } },
};

export type EnableCheck = { ok: true } | { ok: false; reason: "not_built" } | { ok: false; reason: "needs_policy"; version: number };

export function canEnable(key: FeatureKey, liveVersion: number, registry: Record<FeatureKey, FeatureDef> = FEATURES): EnableCheck {
  const f = registry[key];
  if (!f.implemented) return { ok: false, reason: "not_built" };
  if (f.coveredByPolicy > liveVersion) return { ok: false, reason: "needs_policy", version: f.coveredByPolicy };
  return { ok: true };
}

export const lockText = (c: EnableCheck, lang: "en" | "es"): string | null =>
  c.ok ? null
    : c.reason === "not_built" ? (lang === "es" ? "Aún no está construida" : "Not built yet")
      : lang === "es" ? `Requiere la política v${c.version}` : `Requires policy v${c.version}`;

export interface FlagRow { key: string; enabled: boolean; enabledAt: Date | null }
export interface FeatureState { enabled: boolean; enabledAt: Date | null }

/** Effective state of every feature. A stored ON row for a feature that can no longer be enabled counts as OFF. */
export function resolveStates(rows: FlagRow[] | null | undefined, liveVersion: number, registry: Record<FeatureKey, FeatureDef> = FEATURES): Record<FeatureKey, FeatureState> {
  const out = {} as Record<FeatureKey, FeatureState>;
  for (const key of FEATURE_KEYS) {
    const row = rows?.find((r) => r.key === key);
    const on = !!row?.enabled && canEnable(key, liveVersion, registry).ok;
    out[key] = { enabled: on, enabledAt: on ? row!.enabledAt : null };
  }
  return out;
}
