"use client";

import ContactHero from "@/components/contact/ContactHero";
import ContactMap from "@/components/contact/ContactMap";
import { ContactBody } from "@/components/contact/ContactBody";
import { useLanguage } from "@/context/LanguageContext";

export default function ContactPage() {
  const { locale } = useLanguage();
  return (
    <>
      <ContactHero locale={locale} />
      <ContactBody locale={locale} />
      <ContactMap locale={locale} />
    </>
  );
}
