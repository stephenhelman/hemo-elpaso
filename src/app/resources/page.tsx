import ResourcesHero from "@/components/resources/ResourcesHero";
import ConditionCards from "@/components/resources/ConditionCards";
import NationalOrgs from "@/components/resources/NationalOrgs";
import LocalResources from "@/components/resources/LocalResources";
import CampPrograms from "@/components/resources/CampPrograms";
import InsuranceResources from "@/components/resources/InsuranceResources";
import { Lang } from "@/types";

export const metadata = {
  title: "Resources",
  description:
    "Educational resources, national organizations, local care, and support for families affected by bleeding disorders in El Paso.",
};

export default function ResourcesPage() {
  const lang = "en" as Lang;

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
