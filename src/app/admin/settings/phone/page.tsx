import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { getLocaleCookie } from "@/lib/locale";
import { phoneView } from "@/lib/phone/view";
import PhoneClient from "./PhoneClient";
import type { Lang } from "@/types";

export const dynamic = "force-dynamic";

export default async function PhoneSettingsPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  const canManage = admin.can("canManagePhoneRouting");
  if (!canManage && !admin.can("canSwapPhoneDuty")) redirect("/admin/dashboard");
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  return <PhoneClient view={await phoneView(canManage)} canManage={canManage} locale={locale} />;
}
