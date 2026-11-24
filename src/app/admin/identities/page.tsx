import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import IdentitiesClient from "./IdentitiesClient";

export const dynamic = "force-dynamic";

/** President/VP: unmatched sign-ins, linking, unlinking and merging person records. Needs canManageUsers. */
export default async function IdentitiesPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageUsers")) redirect("/admin/dashboard");
  return <IdentitiesClient />;
}
