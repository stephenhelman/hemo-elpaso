import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import DuplicatesClient from "./DuplicatesClient";

export const dynamic = "force-dynamic";

/** President/VP: possible duplicate records (registration flags, same email, same phone) with merge and "not a duplicate". Needs canManageUsers. */
export default async function DuplicatesPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageUsers")) redirect("/admin/dashboard");
  return <DuplicatesClient />;
}
