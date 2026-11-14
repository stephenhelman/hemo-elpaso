"use client";

import { ImpactStatCard } from "./ImpactStatCard";
import Section from "@/components/layout/Section";
import { impactStatsTranslation } from "@/translation/homePage";
import { Lang } from "@/types";
import { yearsSinceFounding } from "@/lib/site";
interface Props {
  locale: Lang;
}

export default function ImpactStats({ locale }: Props) {
  const t = impactStatsTranslation[locale];

  return (
    <Section background="white" id="impact">
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl font-bold text-neutral-900 mb-3">
          {t.heading}
        </h2>
        <p className="text-neutral-500 max-w-xl mx-auto">{t.sub}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {t.stats.map((stat) => (
          <ImpactStatCard
            key={stat.label}
            value={"computed" in stat && stat.computed === "years" ? yearsSinceFounding() : stat.value}
            suffix={stat.suffix}
            label={stat.label}
          />
        ))}
      </div>
    </Section>
  );
}
