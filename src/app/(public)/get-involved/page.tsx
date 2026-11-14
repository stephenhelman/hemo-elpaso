"use client";

import GetInvolvedHero from "@/components/get-involved/GetInvolvedHero";
import WaysToHelp from "@/components/get-involved/WaysToHelp";
import GetInvolvedCTA from "@/components/get-involved/GetInvolvedCTA";
import { useLanguage } from "@/context/LanguageContext";

export default function GetInvolvedPage() {
  const { locale } = useLanguage();

  return (
    <>
      <GetInvolvedHero locale={locale} />
      <WaysToHelp locale={locale} />
      {/* Hidden for now; component and dictionary are kept. */}
      {/* <SponsorshipTiers locale={locale} /> */}
      <GetInvolvedCTA locale={locale} />
    </>
  );
}
