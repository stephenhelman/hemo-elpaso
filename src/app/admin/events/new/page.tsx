import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { getActiveSponsorOptions } from "@/sanity/sponsors";
import NewEventForm from "./NewEventForm";

export default async function NewEventPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageEvents")) redirect("/admin/events");

  return <NewEventForm sponsorOptions={await getActiveSponsorOptions()} />;
}
