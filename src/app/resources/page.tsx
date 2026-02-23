"use client";

import ResourcesHero from "@/components/resources/ResourcesHero";
import ConditionCards from "@/components/resources/ConditionCards";
import NationalOrgs from "@/components/resources/NationalOrgs";
import LocalResources from "@/components/resources/LocalResources";
import CampPrograms from "@/components/resources/CampPrograms";
import InsuranceResources from "@/components/resources/InsuranceResources";
import { useLanguage } from "@/context/LanguageContext";

export default function ResourcesPage() {
  const { locale } = useLanguage();
  return (
    <>
      <ResourcesHero locale={locale} />
      <ConditionCards locale={locale} />
      <NationalOrgs locale={locale} />
      <LocalResources locale={locale} />
      <CampPrograms locale={locale} />
      <InsuranceResources locale={locale} />
    </>
  );
}
