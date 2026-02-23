"use client";

import Section from "@/components/layout/Section";
import { Check } from "lucide-react";
import { Lang } from "@/types";
import { sponsorshipTiersTranslation } from "@/translation/getInvolvedPage";

interface Props {
  locale: Lang;
}

const tierStyles: Record<
  string,
  {
    border: string;
    header: string;
    check: string;
    badge?: string;
  }
> = {
  neutral: {
    border: "border-neutral-200",
    header: "bg-neutral-50",
    check: "text-neutral-500",
  },
  secondary: {
    border: "border-secondary/20",
    header: "bg-secondary/5",
    check: "text-secondary",
  },
  primary: {
    border: "border-primary-200",
    header: "bg-primary-500 text-white",
    check: "text-white",
    badge: "Most Popular",
  },
  accent: {
    border: "border-accent/20",
    header: "bg-accent/5",
    check: "text-accent-dark",
  },
};

export default function SponsorshipTiers({ locale }: Props) {
  const t = sponsorshipTiersTranslation[locale];

  return (
    <Section background="neutral" id="sponsorship">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {t.tiers.map((tier) => {
          const styles = tierStyles[tier.color];
          const isFeatured = tier.color === "primary";

          return (
            <div
              key={tier.name}
              className={`relative rounded-2xl border overflow-hidden ${styles.border} ${
                isFeatured ? "shadow-lg shadow-primary/10 scale-[1.02]" : ""
              } bg-white`}
            >
              {isFeatured && (
                <div className="absolute top-0 inset-x-0 text-center py-1 bg-primary text-white text-xs font-semibold">
                  ★ Most Popular
                </div>
              )}

              {/* Header */}
              <div
                className={`px-5 py-5 ${isFeatured ? "pt-8" : ""} ${
                  isFeatured
                    ? "bg-primary"
                    : "bg-neutral-50 border-b border-neutral-100"
                }`}
              >
                <h3
                  className={`font-display font-bold text-sm mb-1 ${
                    isFeatured ? "text-white" : "text-neutral-900"
                  }`}
                >
                  {tier.name}
                </h3>
                <p
                  className={`font-display font-bold text-3xl ${
                    isFeatured ? "text-white" : "text-neutral-900"
                  }`}
                >
                  {tier.price}
                </p>
              </div>

              {/* Perks */}
              <div className="px-5 py-5">
                <ul className="space-y-2.5">
                  {tier.perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-start gap-2 text-sm text-neutral-600"
                    >
                      <Check
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          isFeatured ? "text-primary" : styles.check
                        }`}
                      />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-neutral-500">
        {t.contact}{" "}
        <a
          href="mailto:info@hemo-el-paso.org"
          className="text-primary font-semibold hover:underline"
        >
          info@hemo-el-paso.org
        </a>
      </p>
    </Section>
  );
}
