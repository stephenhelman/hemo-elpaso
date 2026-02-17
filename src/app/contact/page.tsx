"use client";

import ContactHero from "@/components/contact/ContactHero";
import ContactForm from "@/components/contact/ContactForm";
import ContactInfo from "@/components/contact/ContactInfo";
import ContactMap from "@/components/contact/ContactMap";
import { useLang } from "@/context/LanguageContext";
import { Lang } from "@/types";

export default function ContactPage() {
  const { lang } = useLang();

  return (
    <>
      <ContactHero lang={lang} />
      <ContactBody lang={lang} />
      <ContactMap lang={lang} />
    </>
  );
}

function ContactBody({ lang }: { lang: Lang }) {
  return (
    <div className="bg-neutral-50">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ContactForm lang={lang} />
          </div>
          <div>
            <ContactInfo lang={lang} />
          </div>
        </div>
      </div>
    </div>
  );
}
