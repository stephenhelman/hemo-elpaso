"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { CALL_US_PHONE } from "@/lib/rsvp/window";

const copy = {
  en: {
    title: "Online registration isn't open yet",
    body: "To register or RSVP, please call us. We're happy to help.",
    contact: "Contact us",
  },
  es: {
    title: "El registro en línea aún no está abierto",
    body: "Para registrarte o confirmar asistencia, llámanos. Con gusto te ayudamos.",
    contact: "Contáctanos",
  },
};

/** Shown at /register-info while REGISTRATION_OPEN is not "true". */
export default function RegistrationClosed() {
  const { locale } = useLanguage();
  const t = copy[locale];
  return (
    <div className="bg-neutral-50 min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Phone className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display font-bold text-2xl text-neutral-900 mb-3">{t.title}</h1>
        <p className="text-neutral-600 mb-5">{t.body}</p>
        <a href={`tel:${CALL_US_PHONE.replace(/-/g, "")}`} className="block text-2xl font-display font-bold text-primary mb-6">
          {CALL_US_PHONE.replace(/(\d{3})-(\d{3})-(\d{4})/, "($1) $2-$3")}
        </a>
        <Link href="/contact" className="inline-flex px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors">
          {t.contact}
        </Link>
      </div>
    </div>
  );
}
