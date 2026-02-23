"use client";

import Link from "next/link";
import Section from "@/components/layout/Section";
import { ArrowRight, Mail } from "lucide-react";
import { aboutCTATranslation } from "@/translation/aboutPage";
import { Lang } from "@/types";

interface Props {
  locale: Lang;
}

export default function AboutCTA({ locale }: Props) {
  const t = aboutCTATranslation[locale];

  return (
    <Section background="neutral">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
          {t.heading}
        </h2>
        <p className="text-neutral-500 text-lg mb-8 leading-relaxed">{t.sub}</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/get-involved"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-white font-display font-semibold hover:bg-primary-600 transition-colors group"
          >
            {t.cta1}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-neutral-300 text-neutral-700 font-display font-semibold hover:border-primary hover:text-primary transition-colors"
          >
            <Mail className="w-4 h-4" />
            {t.cta2}
          </Link>
        </div>
      </div>
    </Section>
  );
}
