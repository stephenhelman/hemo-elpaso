import Hero from "@/components/home/Hero";
import ImpactStats from "@/components/home/ImpactStats";
import UpcomingEvents from "@/components/home/UpcomingEvents";
import NewsletterSignup from "@/components/home/NewsletterSignup";

export default function Home() {
  // TODO: pass lang from context/cookie
  const lang = "en" as "en" | "es";

  return (
    <>
      <Hero lang={lang} />
      <ImpactStats lang={lang} />
      <UpcomingEvents lang={lang} />
      <NewsletterSignup lang={lang} />
    </>
  );
}
