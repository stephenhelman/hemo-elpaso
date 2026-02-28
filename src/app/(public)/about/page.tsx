"use client";

import AboutHero from "@/components/about/AboutHero";
import FounderStory from "@/components/about/FounderStory";
import MissionValues from "@/components/about/MissionValues";
import BoardOfDirectors from "@/components/about/BoardOfDirectors";
import AboutCTA from "@/components/about/AboutCTA";
import FounderSpotlight from "@/components/about/FounderSpotlight";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutPage() {
  const { locale } = useLanguage();
  return (
    <>
      <AboutHero locale={locale} />
      <FounderStory locale={locale} />
      <MissionValues locale={locale} />
      <FounderSpotlight locale={locale} />
      <BoardOfDirectors locale={locale} />
      <AboutCTA locale={locale} />
    </>
  );
}
