import AboutHero from "@/components/about/AboutHero";
import FounderStory from "@/components/about/FounderStory";
import MissionValues from "@/components/about/MissionValues";
import BoardOfDirectors from "@/components/about/BoardOfDirectors";
import AboutCTA from "@/components/about/AboutCTA";
import FounderSpotlight from "@/components/about/FounderSpotlight";

export const metadata = {
  title: "About Us",
  description:
    "Learn about Hemophilia Outreach of El Paso, founded in 1993 by Lou Anne Fetters to support families affected by bleeding disorders.",
};

export default function AboutPage() {
  const lang = "en" as "en" | "es";

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
