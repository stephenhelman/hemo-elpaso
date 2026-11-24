import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { getLocaleCookie } from "@/lib/locale";
import { emailDomain } from "@/lib/site";
import { getRequireOrgAccount, listOfficers } from "@/lib/identity/settings";
import SignInClient from "./SignInClient";
import type { Lang } from "@/types";

export const dynamic = "force-dynamic";

export default async function SignInSettingsPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageSettings")) redirect("/admin/dashboard");
  const locale: Lang = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  const officers = (await listOfficers()).map((o) => ({ patientId: o.patientId, role: o.role, name: o.name, hasOrgIdentity: o.hasOrgIdentity }));
  return <SignInClient enabled={await getRequireOrgAccount()} officers={officers} locale={locale} domain={emailDomain()} />;
}
