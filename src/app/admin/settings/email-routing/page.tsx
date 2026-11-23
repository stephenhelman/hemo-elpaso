import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { getLocaleCookie } from "@/lib/locale";
import { emailDomain } from "@/lib/site";
import { ROUTE_DEFS, ROUTE_KEYS, defaultRecipients, resolveRecipients } from "@/lib/email-routing/definitions";
import { readStoredFresh } from "@/lib/email-routing";
import EmailRoutingClient, { type RouteView } from "./EmailRoutingClient";
import type { Lang } from "@/types";

export const dynamic = "force-dynamic";

export default async function EmailRoutingPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageEmailRouting")) redirect("/admin/dashboard");

  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  const domain = emailDomain();

  let loadError = false;
  const routes: RouteView[] = [];
  for (const key of ROUTE_KEYS) {
    let stored: string[] | null = null;
    try {
      stored = await readStoredFresh(key);
    } catch {
      loadError = true;
    }
    const def = ROUTE_DEFS[key];
    routes.push({
      key,
      group: def.group,
      mode: def.mode,
      options: [...def.options],
      allowTyped: def.allowTyped,
      publishedInPolicy: !!def.publishedInPolicy,
      label: def.label[locale],
      help: def.help[locale],
      value: resolveRecipients(key, stored, domain),
      isDefault: stored === null,
      defaultValue: defaultRecipients(key, domain),
    });
  }

  return <EmailRoutingClient routes={routes} domain={domain} locale={locale} loadError={loadError} />;
}
