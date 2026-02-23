import { Metadata } from "next";
import { cookies } from "next/headers";

import GetInvolvedHero from "@/components/get-involved/GetInvolvedHero";
import WaysToHelp from "@/components/get-involved/WaysToHelp";
import VolunteerForm from "@/components/get-involved/VolunteerForm";
import SponsorshipTiers from "@/components/get-involved/SponsorshipTiers";
import GetInvolvedCTA from "@/components/get-involved/GetInvolvedCTA";

export const metadata: Metadata = {
  title: "Get Involved",
  description:
    "Join the Hemophilia Outreach of El Paso community as a volunteer, sponsor, or supporter.",
};

export default async function GetInvolvedPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value as "en" | "es") || "en";
  return (
    <>
      <GetInvolvedHero locale={locale} />
      <WaysToHelp locale={locale} />
      <VolunteerForm />
      <SponsorshipTiers locale={locale} />
      <GetInvolvedCTA locale={locale} />
    </>
  );
}
