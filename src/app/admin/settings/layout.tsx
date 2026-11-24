import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import SettingsShell from "./SettingsShell";

export const dynamic = "force-dynamic";

/** Which settings tabs a user sees follows their permissions; each page and API route still checks its own. */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  const allowed = [
    admin.can("canManageSettings") && "/admin/settings",
    admin.can("canManagePermissions") && "/admin/settings/permissions",
    admin.can("canManageEmailTemplates") && "/admin/settings/email-templates",
    admin.can("canManageEmailRouting") && "/admin/settings/email-routing",
    admin.can("canAssignBoardRoles") && "/admin/settings/board",
  ].filter(Boolean) as string[];
  return <SettingsShell allowed={allowed}>{children}</SettingsShell>;
}
