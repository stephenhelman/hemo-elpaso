"use client";

import Section from "@/components/layout/Section";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { yearsSinceFounding } from "@/lib/site";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import type { Section as SectionData } from "@/sanity/types";
import SectionHeaderView from "./SectionHeaderView";

type Block = Extract<SectionData, { _type: "statsRow" }>;

const COLS: Record<number, string> = {
  1: "grid grid-cols-1 gap-6",
  2: "grid grid-cols-2 gap-6",
  3: "grid grid-cols-2 lg:grid-cols-3 gap-6",
  4: "grid grid-cols-2 lg:grid-cols-4 gap-6",
};

export default function StatsRowBlock({ block, locale }: { block: Block; locale: Lang }) {
  const stats = (block.stats ?? []).slice(0, 4);
  if (stats.length === 0) return null;
  return (
    <Section background="white" id="impact">
      <SectionHeaderView header={block.header} locale={locale} />
      <div className={COLS[stats.length]}>
        {stats.map((st, i) => {
          // yearsOfService ignores `value` and counts from the founding year, so it never goes stale.
          const value = st.source === "yearsOfService" ? yearsSinceFounding() : st.value ?? 0;
          const suffix = st.suffix ?? "";
          return (
            <div key={st._key ?? i} className="text-center p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="font-display text-4xl lg:text-5xl font-bold text-primary mb-2">
                {st.animate === false ? (
                  <span>{`${value}${suffix}`}</span>
                ) : (
                  <AnimatedCounter end={value} suffix={suffix} />
                )}
              </div>
              <p className="text-sm font-medium text-neutral-500">{pick(st.label, locale)}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
