"use client";

import ScholarshipsHero from "@/components/scholarships/ScholarshipsHero";
import ScholarshipCard from "@/components/scholarships/ScholarshipCard";
import ScholarshipContacts from "@/components/scholarships/ScholarshipContacts";
import ScholarshipCTA from "@/components/scholarships/ScholarshipCTA";
import { useLanguage } from "@/context/LanguageContext";

export default function ScholarshipsPage() {
  const { locale } = useLanguage();
  return (
    <>
      <ScholarshipsHero locale={locale} />
      <ScholarshipCard locale={locale} />
      {/* Hidden until a new cycle opens; component and dictionary are kept. */}
      {/* <EligibilityRequirements locale={locale} /> */}
      <ScholarshipContacts locale={locale} />
      <ScholarshipCTA locale={locale} />
    </>
  );
}
