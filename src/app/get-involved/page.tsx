"use client";

import GetInvolvedHero from "@/components/get-involved/GetInvolvedHero";
import WaysToHelp from "@/components/get-involved/WaysToHelp";
import VolunteerForm from "@/components/get-involved/VolunteerForm";
import SponsorshipTiers from "@/components/get-involved/SponsorshipTiers";
import GetInvolvedCTA from "@/components/get-involved/GetInvolvedCTA";

import { useLang } from "@/context/LanguageContext";

export default function GetInvolvedPage() {
  const { lang } = useLang();

  return (
    <>
      <GetInvolvedHero lang={lang} />
      <WaysToHelp lang={lang} />
      <VolunteerForm lang={lang} />
      <SponsorshipTiers lang={lang} />
      <GetInvolvedCTA lang={lang} />
    </>
  );
}
