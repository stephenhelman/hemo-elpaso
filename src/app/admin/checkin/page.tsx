import { redirect } from "next/navigation";
import { getLocaleCookie } from "@/lib/locale";
import { getAdminWithPermissions } from "@/lib/permissions";
import { Lang } from "@/types";
import AdminCheckinClient from "./AdminCheckinClient";

export default async function AdminCheckinPage({
  searchParams,
}: {
  searchParams: { event?: string };
}) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canManageEvents")) redirect("/portal/dashboard");

  const locale = (await getLocaleCookie()) as Lang;

  return (
    <AdminCheckinClient
      locale={locale}
      preselectedEventId={searchParams.event ?? null}
    />
  );
}
