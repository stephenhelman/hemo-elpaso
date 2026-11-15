import { redirect } from "next/navigation";
import { getLocaleCookie } from "@/lib/locale";
import { getAdminWithPermissions } from "@/lib/permissions";
import { Lang } from "@/types";
import AdminCheckinClient from "./AdminCheckinClient";

export default async function AdminCheckinPage({
  searchParams,
}: {
  searchParams: { event?: string; tab?: string; noPhotos?: string };
}) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageEvents")) redirect("/");

  const locale = (await getLocaleCookie()) as Lang;

  return (
    <AdminCheckinClient
      locale={locale}
      preselectedEventId={searchParams.event ?? null}
      initialTab={searchParams.tab === "guests" || searchParams.tab === "walkin" ? searchParams.tab : "scan"}
      noPhotosOnly={searchParams.noPhotos === "1"}
    />
  );
}
