import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import NewMinutesForm from "./NewMinutesForm";

export default async function NewMinutesPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageMinutes")) redirect("/admin/minutes");

  return <NewMinutesForm />;
}
