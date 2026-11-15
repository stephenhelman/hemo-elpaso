import { getAboutPage } from "@/sanity/data";
import PageSections from "@/components/sanity/PageSections";

/**
 * Rendered from Sanity (aboutPage + person documents), with today's dictionary copy as the
 * fallback if Sanity is unreachable. The old components in components/about/* are kept
 * as reference; they are no longer rendered.
 */
export default async function AboutPage() {
  const data = await getAboutPage();
  return <PageSections sections={data.sections} />;
}
