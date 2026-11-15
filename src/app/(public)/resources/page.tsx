import { getResourcesPage } from "@/sanity/data";
import PageSections from "@/components/sanity/PageSections";

/**
 * Rendered from Sanity (resourcesPage + resource documents), with today's dictionary copy as the
 * fallback if Sanity is unreachable. The old components in components/resources/* are kept
 * as reference; they are no longer rendered.
 */
export default async function ResourcesPage() {
  const data = await getResourcesPage();
  return <PageSections sections={data.sections} />;
}
