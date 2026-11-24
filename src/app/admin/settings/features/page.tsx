import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { getLocaleCookie } from "@/lib/locale";
import { LIVE_POLICY_VERSION } from "@/content/legal/meta";
import { FEATURES, FEATURE_KEYS, canEnable, lockText } from "@/lib/features/registry";
import { readFlagsFresh } from "@/lib/features";
import FeaturesClient, { type FeatureView } from "./FeaturesClient";
import type { Lang } from "@/types";

export const dynamic = "force-dynamic";

export default async function FeaturesPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageFeatureToggles")) redirect("/admin/dashboard");

  const locale: Lang = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  let loadError = false;
  const rows = await readFlagsFresh().catch(() => { loadError = true; return []; });

  const features: FeatureView[] = FEATURE_KEYS.map((key) => {
    const check = canEnable(key, LIVE_POLICY_VERSION);
    const row = rows.find((r) => r.key === key);
    return {
      key, label: FEATURES[key].label[locale], locked: lockText(check, locale),
      enabled: !!row?.enabled && check.ok, enabledAt: row?.enabled && row.enabledAt ? row.enabledAt.toISOString() : null,
    };
  });
  return <FeaturesClient features={features} locale={locale} loadError={loadError} policyVersion={LIVE_POLICY_VERSION} />;
}
