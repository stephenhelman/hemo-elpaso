import ScholarshipsHero from "@/components/scholarships/ScholarshipsHero";
import ScholarshipCard from "@/components/scholarships/ScholarshipCard";
import EligibilityRequirements from "@/components/scholarships/EligibilityRequirements";
import ScholarshipContacts from "@/components/scholarships/ScholarshipContacts";
import ScholarshipCTA from "@/components/scholarships/ScholarshipCTA";
import { Lang } from "@/types";

export const metadata = {
  title: "Scholarships",
  description:
    "The Jesus M. Terrazas and Luis Ostos Memorial Scholarship — awarded by Hemophilia Outreach of El Paso to students affected by bleeding disorders.",
};

export default function ScholarshipsPage() {
  const lang = "en" as Lang;

  return (
    <>
      <ScholarshipsHero lang={lang} />
      <ScholarshipCard lang={lang} />
      <EligibilityRequirements lang={lang} />
      <ScholarshipContacts lang={lang} />
      <ScholarshipCTA lang={lang} />
    </>
  );
}
