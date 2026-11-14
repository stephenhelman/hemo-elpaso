"use client";

import Section from "@/components/layout/Section";
import { Clock } from "lucide-react";
import { Lang } from "@/types";
import { scholarshipCardTranslation } from "@/translation/scholarshipsPage";

interface Props {
  locale: Lang;
}

/**
 * "Next cycle coming soon" state. The full program card (amount, recipients,
 * deadline, semester, essay prompt) was removed on purpose; restore it from git
 * history (pre fix/content-accuracy) when a new cycle opens.
 */
export default function ScholarshipCard({ locale }: Props) {
  const t = scholarshipCardTranslation[locale];

  return (
    <Section background="neutral">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-0.5 bg-primary-400" />
          <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">
            {t.eyebrow}
          </span>
          <div className="w-8 h-0.5 bg-primary-400" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-8 py-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-snug">
                {t.heading}
              </h2>
              <span className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border bg-white/20 text-white border-white/30">
                {t.status}
              </span>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100">
              <span className="text-xl flex-shrink-0">🕊️</span>
              <p className="text-primary-800 text-sm leading-relaxed italic">
                {t.in_memory}
              </p>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <Clock className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
              <p className="text-neutral-600 text-sm">{t.soonBody}</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
