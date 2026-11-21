import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { listInactiveHouseholds, INACTIVE_YEARS } from "@/lib/retention";
import InactiveHouseholdsClient from "@/components/admin/patients/InactiveHouseholdsClient";
import { getLocaleCookie } from "@/lib/locale";

export const dynamic = "force-dynamic";

/** President/VP only (canManageUsers, same as Patients). Nothing here is deleted automatically. */
export default async function InactiveHouseholdsPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageUsers")) redirect("/admin/dashboard");
  const locale = (await getLocaleCookie()) === "es" ? "es" : "en";
  const rows = await listInactiveHouseholds();
  return (
    <InactiveHouseholdsClient
      locale={locale}
      years={INACTIVE_YEARS}
      rows={rows.map((r) => ({
        id: r.id,
        name: r.name,
        lastActivity: r.lastActivity.toISOString(),
        contactedAt: r.contactedAt ? r.contactedAt.toISOString() : null,
      }))}
    />
  );
}
