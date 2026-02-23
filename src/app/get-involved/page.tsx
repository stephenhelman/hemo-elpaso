import GetInvolvedHero from "@/components/get-involved/GetInvolvedHero";
import WaysToHelp from "@/components/get-involved/WaysToHelp";
import VolunteerForm from "@/components/get-involved/VolunteerForm";
import SponsorshipTiers from "@/components/get-involved/SponsorshipTiers";
import GetInvolvedCTA from "@/components/get-involved/GetInvolvedCTA";
import { useLanguage } from "@/context/LanguageContext";

export default function GetInvolvedPage() {
  const { locale } = useLanguage();
  return (
    <>
      <GetInvolvedHero locale={locale} />
      <WaysToHelp locale={locale} />
      <VolunteerForm locale={locale} />
      <SponsorshipTiers locale={locale} />
      <GetInvolvedCTA locale={locale} />
    </>
  );
}
