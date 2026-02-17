import Section from "@/components/layout/Section";
import { Calendar, DollarSign, Users, AlertCircle } from "lucide-react";
import { Lang } from "@/types";

interface Props {
  lang: Lang;
}

const content = {
  en: {
    eyebrow: "Current Scholarship",
    heading: "Jesus M. Terrazas & Luis Ostos Memorial Scholarship",
    semester: "Spring Semester 2026",
    in_memory:
      "In memory of Jesus M. Terrazas and Luis Ostos — dedicated members of our bleeding disorders community.",
    amount: "$500",
    amountLabel: "Award Amount",
    recipients: "3 Students",
    recipientsLabel: "Recipients",
    deadline: "November 25, 2025",
    deadlineLabel: "Application Deadline",
    deadlinePast:
      "The deadline for this scholarship cycle has passed. Check back for the next cycle.",
    essay: "Essay Prompt",
    essayPrompt:
      '"How will you be advocating for bleeding disorders through your time in college?"',
    essayLength: "300–400 words",
    apply: "Apply at",
    applyUrl: "www.hemoelpaso.org",
    status: "Deadline Passed",
    statusOpen: "Now Accepting Applications",
  },
  es: {
    eyebrow: "Beca Actual",
    heading: "Beca Memorial Jesus M. Terrazas y Luis Ostos",
    semester: "Semestre de Primavera 2026",
    in_memory:
      "En memoria de Jesus M. Terrazas y Luis Ostos — miembros dedicados de nuestra comunidad de trastornos hemorrágicos.",
    amount: "$500",
    amountLabel: "Monto del Premio",
    recipients: "3 Estudiantes",
    recipientsLabel: "Beneficiarios",
    deadline: "25 de noviembre de 2025",
    deadlineLabel: "Fecha Límite",
    deadlinePast:
      "La fecha límite para este ciclo de becas ha pasado. Vuelva para el próximo ciclo.",
    essay: "Tema del Ensayo",
    essayPrompt:
      '"¿Cómo abogará por los trastornos hemorrágicos durante su tiempo en la universidad?"',
    essayLength: "300–400 palabras",
    apply: "Aplique en",
    applyUrl: "www.hemoelpaso.org",
    status: "Plazo Vencido",
    statusOpen: "Aceptando Solicitudes",
  },
};

export default function ScholarshipCard({ lang }: Props) {
  const t = content[lang];
  const deadlinePassed = new Date() > new Date("2025-11-25");

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
          {/* Top banner */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-8 py-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-primary-200 text-sm font-semibold mb-1">
                  {t.semester}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-snug">
                  {t.heading}
                </h2>
              </div>
              <span
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border ${
                  deadlinePassed
                    ? "bg-neutral-500/20 text-neutral-200 border-neutral-400/30"
                    : "bg-white/20 text-white border-white/30"
                }`}
              >
                {deadlinePassed ? t.status : t.statusOpen}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100 border-b border-neutral-100">
            <StatCell
              icon={<DollarSign className="w-5 h-5" />}
              label={t.amountLabel}
              value={t.amount}
            />
            <StatCell
              icon={<Users className="w-5 h-5" />}
              label={t.recipientsLabel}
              value={t.recipients}
            />
            <StatCell
              icon={<Calendar className="w-5 h-5" />}
              label={t.deadlineLabel}
              value={t.deadline}
            />
          </div>

          {/* Body */}
          <div className="p-8 space-y-6">
            {/* In memory */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100">
              <span className="text-xl flex-shrink-0">🕊️</span>
              <p className="text-primary-800 text-sm leading-relaxed italic">
                {t.in_memory}
              </p>
            </div>

            {/* Deadline passed notice */}
            {deadlinePassed && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <AlertCircle className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <p className="text-neutral-600 text-sm">{t.deadlinePast}</p>
              </div>
            )}

            {/* Essay prompt */}
            <div>
              <h3 className="font-display font-bold text-neutral-900 mb-3 flex items-center gap-2">
                ✍️ {t.essay}
                <span className="text-xs font-normal text-neutral-400">
                  ({t.essayLength})
                </span>
              </h3>
              <blockquote className="border-l-4 border-primary-300 pl-4 py-1">
                <p className="text-neutral-700 italic leading-relaxed">
                  {t.essayPrompt}
                </p>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function StatCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-5">
      <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="font-display font-bold text-neutral-900">{value}</p>
      </div>
    </div>
  );
}
