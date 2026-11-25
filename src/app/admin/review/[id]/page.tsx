import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import ReviewHouseholdClient from "./ReviewHouseholdClient";

export const dynamic = "force-dynamic";

/** One household for review: contact details and members only. No diagnoses, no consents, no editing. */
export default async function ReviewHouseholdPage({ params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageUsers") && !admin.can("canReviewRegistrations")) redirect("/admin/dashboard");
  return <ReviewHouseholdClient id={params.id} />;
}
