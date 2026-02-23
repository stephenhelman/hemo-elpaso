"use client";

import Link from "next/link";
import Section from "@/components/layout/Section";
import { ArrowRight, Bell } from "lucide-react";
import { Lang } from "@/types";
import { scholarshipCTATranslation } from "@/translation/scholarshipsPage";

interface Props {
  locale: Lang;
}

export default function ScholarshipCTA({ locale }: Props) {
  const t = scholarshipCTATranslation[locale];

  return (
    <Section background="white">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-6">
          <Bell className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-display text-3xl font-bold text-neutral-900 mb-4">
          {t.heading}
        </h2>
        <p className="text-neutral-500 text-lg mb-8 leading-relaxed">{t.sub}</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/#newsletter"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-white font-display font-semibold hover:bg-primary-600 transition-colors group"
          >
            <Bell className="w-4 h-4" />
            {t.cta1}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-neutral-300 text-neutral-700 font-display font-semibold hover:border-primary hover:text-primary transition-colors"
          >
            {t.cta2}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </Section>
  );
}
