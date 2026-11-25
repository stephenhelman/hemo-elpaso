import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import ReviewClient from "./ReviewClient";

export const dynamic = "force-dynamic";

/** Registrations waiting for review: President/VP (canManageUsers) and the reviewer tier (canReviewRegistrations). Also enforced on /api/admin/review and by middleware for /admin/*. */
export default async function ReviewPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageUsers") && !admin.can("canReviewRegistrations")) redirect("/admin/dashboard");
  return <ReviewClient />;
}
