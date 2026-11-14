import { redirect } from "next/navigation";
import { NextStudio } from "next-sanity/studio";
import { getAdminWithPermissions } from "@/lib/permissions";
import config from "@/sanity/sanity.config";

export const dynamic = "force-dynamic";
export { metadata, viewport } from "next-sanity/studio";

/**
 * Embedded Sanity Studio. Two gates: middleware (board + canEditSiteContent) and
 * this check. The Studio talks only to Sanity; it has no access to Postgres.
 * Writing also requires a Sanity project role (see docs/overhaul/SANITY_SETUP.md).
 */
export default async function StudioPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canEditSiteContent")) redirect("/admin/dashboard");

  // Fill the content area to the right of the admin sidebar (below the mobile top bar).
  return (
    <div className="fixed inset-x-0 bottom-0 top-16 lg:top-0 lg:left-64 z-10 bg-white">
      <NextStudio config={config} />
    </div>
  );
}
