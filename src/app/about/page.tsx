"use client";

import AboutHero from "@/components/about/AboutHero";
import FounderStory from "@/components/about/FounderStory";
import MissionValues from "@/components/about/MissionValues";
import BoardOfDirectors from "@/components/about/BoardOfDirectors";
import AboutCTA from "@/components/about/AboutCTA";
import FounderSpotlight from "@/components/about/FounderSpotlight";
import { useLang } from "@/context/LanguageContext";

export default function AboutPage() {
  const { lang } = useLang();

  return (
    <>
      <AboutHero lang={lang} />
      <FounderStory lang={lang} />
      <MissionValues lang={lang} />
      <FounderSpotlight lang={lang} />
      <BoardOfDirectors lang={lang} />
      <AboutCTA lang={lang} />
    </>
  );
}
