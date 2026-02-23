import { Metadata } from "next";
import { cookies } from "next/headers";

import Hero from "@/components/home/Hero";
import ImpactStats from "@/components/home/ImpactStats";
import UpcomingEvents from "@/components/home/UpcomingEvents";
import NewsletterSignup from "@/components/home/NewsletterSignup";

export const metadata: Metadata = {
  title: {
    default: "Hemophilia Outreach of El Paso",
    template: "%s | Hemophilia Outreach of El Paso",
  },
  description:
    "Supporting individuals and families affected by bleeding disorders in the El Paso community.",
};

export default async function Home() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value as "en" | "es") || "en";
  return (
    <>
      <Hero />
      <ImpactStats locale={locale} />
      <UpcomingEvents />
      <NewsletterSignup />
    </>
  );
}
