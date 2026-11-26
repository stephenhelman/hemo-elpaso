import { getResourcesPage } from "@/sanity/data";
import PageSections from "@/components/sanity/PageSections";
import { prepareConferenceSections } from "@/sanity/helpers/conferences";

/**
 * Rendered from Sanity (resourcesPage + resource documents), with today's dictionary copy as the
 * fallback if Sanity is unreachable. The old components in components/resources/* are kept
 * as reference; they are no longer rendered.
 */
export default async function ResourcesPage() {
  const data = await getResourcesPage();
  // Per request (this route is dynamic: the layout reads the locale cookie), so ended conferences drop off on time
  // even while the Sanity response is cached.
  return <PageSections sections={prepareConferenceSections(data.sections)} />;
}
