import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import NewEventForm from "./NewEventForm";

export default async function NewEventPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canManageEvents")) redirect("/admin/events");

  return <NewEventForm />;
}
