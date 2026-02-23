import { Metadata } from "next";
import { cookies } from "next/headers";

import ResourcesHero from "@/components/resources/ResourcesHero";
import ConditionCards from "@/components/resources/ConditionCards";
import NationalOrgs from "@/components/resources/NationalOrgs";
import LocalResources from "@/components/resources/LocalResources";
import CampPrograms from "@/components/resources/CampPrograms";
import InsuranceResources from "@/components/resources/InsuranceResources";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Educational resources, national organizations, local care, and support for families affected by bleeding disorders in El Paso.",
};

export default async function ResourcesPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value as "en" | "es") || "en";
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
