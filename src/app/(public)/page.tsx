"use client";

import Hero from "@/components/home/Hero";
import ImpactStats from "@/components/home/ImpactStats";
import UpcomingEvents from "@/components/home/UpcomingEvents";
import RegisterInfoSection from "@/components/home/RegisterInfoSection";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteFlags } from "@/context/SiteFlagsContext";

export default function Home() {
  const { locale } = useLanguage();
  const { registrationOpen } = useSiteFlags();

  return (
    <>
      <Hero locale={locale} />
      <ImpactStats locale={locale} />
      <UpcomingEvents locale={locale} />
      {registrationOpen && <RegisterInfoSection locale={locale} />}
    </>
  );
}
