import { Metadata } from "next";
import { cookies } from "next/headers";

import ScholarshipsHero from "@/components/scholarships/ScholarshipsHero";
import ScholarshipCard from "@/components/scholarships/ScholarshipCard";
import EligibilityRequirements from "@/components/scholarships/EligibilityRequirements";
import ScholarshipContacts from "@/components/scholarships/ScholarshipContacts";
import ScholarshipCTA from "@/components/scholarships/ScholarshipCTA";

export const metadata: Metadata = {
  title: "Scholarships",
  description:
    "The Jesus M. Terrazas and Luis Ostos Memorial Scholarship — awarded by Hemophilia Outreach of El Paso to students affected by bleeding disorders.",
};

export default async function ScholarshipsPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value as "en" | "es") || "en";
  return (
    <>
      <ScholarshipsHero locale={locale} />
      <ScholarshipCard locale={locale} />
      <EligibilityRequirements locale={locale} />
      <ScholarshipContacts locale={locale} />
      <ScholarshipCTA locale={locale} />
    </>
  );
}
