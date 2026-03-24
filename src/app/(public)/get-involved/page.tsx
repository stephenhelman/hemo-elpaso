"use client";

import { useState } from "react";
import GetInvolvedHero from "@/components/get-involved/GetInvolvedHero";
import WaysToHelp from "@/components/get-involved/WaysToHelp";
import SponsorshipTiers from "@/components/get-involved/SponsorshipTiers";
import GetInvolvedCTA from "@/components/get-involved/GetInvolvedCTA";
import VolunteerModal from "@/components/get-involved/VolunteerModal";
import SponsorInquiryModal from "@/components/get-involved/SponsorInquiryModal";
import { useLanguage } from "@/context/LanguageContext";

export default function GetInvolvedPage() {
  const { locale } = useLanguage();
  const [volunteerOpen, setVolunteerOpen] = useState(false);
  const [sponsorTier, setSponsorTier] = useState<string | null>(null);

  return (
    <>
      <GetInvolvedHero locale={locale} />
      <WaysToHelp
        locale={locale}
        onOpenVolunteer={() => setVolunteerOpen(true)}
      />
      <SponsorshipTiers
        locale={locale}
        onInquire={(tier) => setSponsorTier(tier)}
      />
      <GetInvolvedCTA
        locale={locale}
        onOpenVolunteer={() => setVolunteerOpen(true)}
      />

      {volunteerOpen && (
        <VolunteerModal
          locale={locale}
          onClose={() => setVolunteerOpen(false)}
        />
      )}
      {sponsorTier && (
        <SponsorInquiryModal
          tier={sponsorTier}
          locale={locale}
          onClose={() => setSponsorTier(null)}
        />
      )}
    </>
  );
}
