import { getScholarshipsPage } from "@/sanity/data";
import { effectiveStatus } from "@/sanity/scholarship";
import ScholarshipsPageView from "@/components/scholarships/ScholarshipsPageView";

/**
 * Rendered from Sanity (page + scholarship docs), with today's dictionary copy as
 * the fallback if Sanity is unreachable. The old dictionary-driven components
 * (ScholarshipsHero, ScholarshipCard, EligibilityRequirements, ScholarshipContacts,
 * ScholarshipCTA) are kept for reference/fallback work.
 */
export default async function ScholarshipsPage() {
  const data = await getScholarshipsPage();
  const status = effectiveStatus(data.scholarship ?? null);
  return <ScholarshipsPageView data={data} status={status} />;
}
