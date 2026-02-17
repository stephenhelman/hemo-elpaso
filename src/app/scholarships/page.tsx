"use client";

import ScholarshipsHero from "@/components/scholarships/ScholarshipsHero";
import ScholarshipCard from "@/components/scholarships/ScholarshipCard";
import EligibilityRequirements from "@/components/scholarships/EligibilityRequirements";
import ScholarshipContacts from "@/components/scholarships/ScholarshipContacts";
import ScholarshipCTA from "@/components/scholarships/ScholarshipCTA";
import { useLang } from "@/context/LanguageContext";

export default function ScholarshipsPage() {
  const { lang } = useLang();

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
