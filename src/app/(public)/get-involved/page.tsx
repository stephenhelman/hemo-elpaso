import { getGetInvolvedPage } from "@/sanity/data";
import PageSections from "@/components/sanity/PageSections";

/**
 * Rendered from Sanity (getInvolvedPage), with today's dictionary copy as the fallback.
 * The Sponsorship Tiers section stays hidden and dormant in code (components/get-involved/SponsorshipTiers.tsx).
 */
export default async function GetInvolvedPage() {
  const data = await getGetInvolvedPage();
  return <PageSections sections={data.sections} />;
}
