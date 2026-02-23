"use client";

import Hero from "@/components/home/Hero";
import ImpactStats from "@/components/home/ImpactStats";
import UpcomingEvents from "@/components/home/UpcomingEvents";
import NewsletterSignup from "@/components/home/NewsletterSignup";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const { locale } = useLanguage();

  return (
    <>
      <Hero locale={locale} />
      <ImpactStats locale={locale} />
      <UpcomingEvents locale={locale} />
      <NewsletterSignup locale={locale} />
    </>
  );
}
