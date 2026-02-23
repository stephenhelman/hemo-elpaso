"use client";

import Section from "@/components/layout/Section";
import { Mail, Phone } from "lucide-react";
import { Lang } from "@/types";
import { scholarshipContactsTranslation } from "@/translation/scholarshipsPage";

interface Props {
  locale: Lang;
}

export default function ScholarshipContacts({ locale }: Props) {
  const t = scholarshipContactsTranslation[locale];

  return (
    <Section background="neutral" id="contact">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-0.5 bg-primary-400" />
          <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">
            {t.eyebrow}
          </span>
          <div className="w-8 h-0.5 bg-primary-400" />
        </div>
        <h2 className="font-display text-3xl font-bold text-neutral-900 mb-3">
          {t.heading}
        </h2>
        <p className="text-neutral-500 max-w-xl mx-auto">{t.sub}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {t.contacts.map((contact) => {
          const initials = contact.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("");

          return (
            <div
              key={contact.name}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-neutral-200 hover:border-primary-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-display font-bold text-lg mb-4">
                {initials}
              </div>
              <h3 className="font-display font-bold text-neutral-900 mb-0.5">
                {contact.name}
              </h3>
              <p className="text-primary-600 text-xs font-semibold mb-4">
                {contact.title}
              </p>
              <div className="space-y-2 w-full">
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {contact.email}
                </a>
                <a
                  href={`tel:${contact.phone.replace(/\D/g, "")}`}
                  className="flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {contact.phone}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
