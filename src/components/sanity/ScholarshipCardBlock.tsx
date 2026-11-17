"use client";

import Section from "@/components/layout/Section";
import { Calendar, DollarSign, Users, Clock, AlertCircle, CheckCircle } from "lucide-react";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import type { ScholarshipData } from "@/sanity/types";
import { scholarshipCardTranslation } from "@/translation/scholarshipsPage";

type Status = "comingSoon" | "open" | "closed";

const fmtDeadline = (iso: string, locale: Lang) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale === "es" ? "es-US" : "en-US", {
    timeZone: "UTC", year: "numeric", month: "long", day: "numeric",
  });

/** Scholarship document card. `status` is already the effective status (closed after the deadline). */
export default function ScholarshipCardBlock({
  scholarship,
  status,
  locale,
}: {
  scholarship: NonNullable<ScholarshipData>;
  status: Status;
  locale: Lang;
}) {
  const t = scholarshipCardTranslation[locale];
  const title = pick(scholarship.title, locale);
  const note = pick(scholarship.memorialNote, locale);
  const semester = pick(scholarship.semester, locale);
  const essay = pick(scholarship.essayPrompt, locale);
  const pill = status === "open" ? t.statusOpen : status === "closed" ? t.statusClosed : t.status;
  const detailed = status !== "comingSoon";

  return (
    <Section background="neutral">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-0.5 bg-primary-400" />
          <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">{t.eyebrow}</span>
          <div className="w-8 h-0.5 bg-primary-400" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-8 py-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                {detailed && semester && <p className="text-primary-200 text-sm font-semibold mb-1">{semester}</p>}
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-snug">{title}</h2>
              </div>
              <span
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border ${
                  status === "open" ? "bg-white/20 text-white border-white/30" : "bg-white/20 text-white border-white/30"
                }`}
              >
                {pill}
              </span>
            </div>
          </div>

          {detailed && (
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100 border-b border-neutral-100">
              {scholarship.amount != null && (
                <StatCell icon={<DollarSign className="w-5 h-5" />} label={t.amountLabel} value={`$${scholarship.amount.toLocaleString("en-US")}`} />
              )}
              {scholarship.recipients != null && (
                <StatCell icon={<Users className="w-5 h-5" />} label={t.recipientsLabel} value={`${scholarship.recipients} ${t.recipientsUnit}`} />
              )}
              {scholarship.deadline && (
                <StatCell icon={<Calendar className="w-5 h-5" />} label={t.deadlineLabel} value={fmtDeadline(scholarship.deadline, locale)} />
              )}
            </div>
          )}

          <div className="p-8 space-y-6">
            {note && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100">
                <span className="text-xl flex-shrink-0">🕊️</span>
                <p className="text-primary-800 text-sm leading-relaxed italic">{note}</p>
              </div>
            )}
            {status === "comingSoon" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <Clock className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <p className="text-neutral-600 text-sm">{t.soonBody}</p>
              </div>
            )}
            {status === "closed" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <AlertCircle className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <p className="text-neutral-600 text-sm">{t.deadlinePast}</p>
              </div>
            )}
            {detailed && essay && (
              <div>
                <h3 className="font-display font-bold text-neutral-900 mb-3 flex items-center gap-2">✍️ {t.essay}</h3>
                <blockquote className="border-l-4 border-primary-300 pl-4 py-1">
                  <p className="text-neutral-700 italic leading-relaxed">{essay}</p>
                </blockquote>
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

function StatCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 px-6 py-5">
      <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <p className="font-display font-bold text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

/** Shown only while a scholarship is open. Same look as the dictionary-based component. */
export function EligibilityList({ scholarship, locale }: { scholarship: NonNullable<ScholarshipData>; locale: Lang }) {
  const items = scholarship.eligibility ?? [];
  if (items.length === 0) return null;
  const t = eligibilityUi[locale];
  return (
    <Section background="white" id="eligibility">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-0.5 bg-primary-400" />
          <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">{t.eyebrow}</span>
          <div className="w-8 h-0.5 bg-primary-400" />
        </div>
        <h2 className="font-display text-3xl font-bold text-neutral-900 mb-3">{t.heading}</h2>
        <p className="text-neutral-500 max-w-xl mx-auto">{t.sub}</p>
      </div>
      <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((req, i) => (
          <div key={i} className="flex gap-4 p-5 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-primary-200 transition-colors">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-display font-bold text-neutral-900 text-sm mb-1">{pick(req.title, locale)}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{pick(req.body, locale)}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

const eligibilityUi = {
  en: { eyebrow: "Who Can Apply", heading: "Eligibility Requirements", sub: "All of the following criteria must be met to be considered for the scholarship." },
  es: { eyebrow: "Quién Puede Aplicar", heading: "Requisitos de Elegibilidad", sub: "Todos los siguientes criterios deben cumplirse para ser considerado para la beca." },
};

