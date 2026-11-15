import { redirect } from "next/navigation";
import { NextStudio } from "next-sanity/studio";
import { getAdminWithPermissions } from "@/lib/permissions";
import config from "@/sanity/sanity.config";
import StudioFrame from "@/components/admin/StudioFrame";

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

  // StudioFrame places Studio below the admin header(s) with a gap and fills the rest of the viewport.
  return (
    <StudioFrame>
      <NextStudio config={config} />
    </StudioFrame>
  );
}
