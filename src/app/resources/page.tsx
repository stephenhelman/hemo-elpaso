"use client";

import ResourcesHero from "@/components/resources/ResourcesHero";
import ConditionCards from "@/components/resources/ConditionCards";
import NationalOrgs from "@/components/resources/NationalOrgs";
import LocalResources from "@/components/resources/LocalResources";
import CampPrograms from "@/components/resources/CampPrograms";
import InsuranceResources from "@/components/resources/InsuranceResources";
import { useLang } from "@/context/LanguageContext";

export default function ResourcesPage() {
  const { lang } = useLang();

  return (
    <>
      <ResourcesHero lang={lang} />
      <ConditionCards lang={lang} />
      <NationalOrgs lang={lang} />
      <LocalResources lang={lang} />
      <CampPrograms lang={lang} />
      <InsuranceResources lang={lang} />
    </>
  );
}
