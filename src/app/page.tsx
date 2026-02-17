"use client";

import Hero from "@/components/home/Hero";
import ImpactStats from "@/components/home/ImpactStats";
import UpcomingEvents from "@/components/home/UpcomingEvents";
import NewsletterSignup from "@/components/home/NewsletterSignup";
import { useLang } from "@/context/LanguageContext";

export default function Home() {
  const { lang } = useLang();
  return (
    <>
      <Hero lang={lang} />
      <ImpactStats lang={lang} />
      <UpcomingEvents lang={lang} />
      <NewsletterSignup lang={lang} />
    </>
  );
}
