import { Metadata } from "next";

import AboutHero from "@/components/about/AboutHero";
import FounderStory from "@/components/about/FounderStory";
import MissionValues from "@/components/about/MissionValues";
import BoardOfDirectors from "@/components/about/BoardOfDirectors";
import AboutCTA from "@/components/about/AboutCTA";
import FounderSpotlight from "@/components/about/FounderSpotlight";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Hemophilia Outreach of El Paso, founded in 1993 by Lou Anne Fetters to support families affected by bleeding disorders.",
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <FounderStory />
      <MissionValues />
      <FounderSpotlight />
      <BoardOfDirectors />
      <AboutCTA />
    </>
  );
}
