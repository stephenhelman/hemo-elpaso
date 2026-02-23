"use client";

import Section from "@/components/layout/Section";
import { CheckCircle } from "lucide-react";
import { Lang } from "@/types";
import { scholarshipEligibilityTranslation } from "@/translation/scholarshipsPage";

interface Props {
  locale: Lang;
}

export default function EligibilityRequirements({ locale }: Props) {
  const t = scholarshipEligibilityTranslation[locale];

  return (
    <Section background="white" id="eligibility">
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

      <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        {t.requirements.map((req, i) => (
          <div
            key={i}
            className="flex gap-4 p-5 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-primary-200 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-display font-bold text-neutral-900 text-sm mb-1">
                {req.title}
              </h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                {req.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
