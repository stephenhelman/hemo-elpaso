"use client";

import Link from "next/link";
import Section from "@/components/layout/Section";
import { ArrowRight } from "lucide-react";
import { Lang } from "@/types";
import { getInvolvedCTATranslation } from "@/translation/getInvolvedPage";

interface Props {
  locale: Lang;
  onOpenVolunteer: () => void;
}

export default function GetInvolvedCTA({ locale, onOpenVolunteer }: Props) {
  const t = getInvolvedCTATranslation[locale];

  return (
    <Section background="white">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
          {t.heading}
        </h2>
        <p className="text-neutral-500 text-lg mb-8 leading-relaxed">{t.sub}</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={onOpenVolunteer}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-white font-display font-semibold hover:bg-primary-600 transition-colors group"
          >
            {t.cta1}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-neutral-300 text-neutral-700 font-display font-semibold hover:border-primary hover:text-primary transition-colors"
          >
            {t.cta2}
          </Link>
        </div>
      </div>
    </Section>
  );
}
