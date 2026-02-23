"use client";

import Section from "@/components/layout/Section";
import { Lang } from "@/types";
import { waysToHelpTranslation } from "@/translation/getInvolvedPage";
import { WayCard } from "./WayCard";

interface Props {
  locale: Lang;
}

export default function WaysToHelp({ locale }: Props) {
  const t = waysToHelpTranslation[locale];

  return (
    <Section background="neutral" id="ways">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {t.ways.map((way) => (
          <WayCard key={way.title} way={way} />
        ))}
      </div>
    </Section>
  );
}
