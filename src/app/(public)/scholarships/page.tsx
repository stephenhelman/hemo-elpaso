"use client";

import ScholarshipsHero from "@/components/scholarships/ScholarshipsHero";
import ScholarshipCard from "@/components/scholarships/ScholarshipCard";
import EligibilityRequirements from "@/components/scholarships/EligibilityRequirements";
import ScholarshipContacts from "@/components/scholarships/ScholarshipContacts";
import ScholarshipCTA from "@/components/scholarships/ScholarshipCTA";
import { useLanguage } from "@/context/LanguageContext";

export default function ScholarshipsPage() {
  const { locale } = useLanguage();
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
