import Section from "@/components/layout/Section";
import { Mail } from "lucide-react";
import {
  boardOfDirectors,
  boardOfDirectorsTranslation,
} from "@/translation/aboutPage";

interface Props {
  lang: "en" | "es";
}

export default function BoardOfDirectors({ lang }: Props) {
  const t = boardOfDirectorsTranslation[lang];

  return (
    <Section background="white">
      {/* Header */}
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
        <p className="text-neutral-500 max-w-2xl mx-auto">{t.sub}</p>
      </div>

      {/* Executive Board */}
      <div className="mb-12">
        <SectionLabel label={t.executiveTitle} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {boardOfDirectors.executive.map((member) => (
            <ExecutiveCard key={member.name} member={member} lang={lang} />
          ))}
        </div>
      </div>

      {/* Officers */}
      <div className="mb-12">
        <SectionLabel label={t.officersTitle} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {boardOfDirectors.officers.map((officer) => (
            <OfficerCard key={officer.name} {...officer} />
          ))}
        </div>
      </div>

      {/* Advisor */}
      <div>
        <SectionLabel label={t.advisorTitle} />
        <div className="max-w-xs">
          <OfficerCard {...t.advisor} />
        </div>
      </div>
    </Section>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <h3 className="font-display font-bold text-neutral-400 text-xs uppercase tracking-widest mb-4">
      {label}
    </h3>
  );
}

function ExecutiveCard({
  member,
  lang,
}: {
  member: (typeof boardOfDirectors.executive)[0];
  lang: "en" | "es";
}) {
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-primary-200 hover:shadow-sm transition-all duration-200">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-display font-bold text-lg mb-4">
        {initials}
      </div>
      <h3 className="font-display font-bold text-neutral-900 text-sm mb-0.5">
        {member.name}
      </h3>
      <p className="text-primary-600 text-xs font-semibold mb-3">
        {lang === "en" ? member.titleEn : member.titleEs}
      </p>
      <a
        href={`mailto:${member.email}`}
        className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-primary transition-colors"
      >
        <Mail className="w-3 h-3" />
        <span className="truncate max-w-[140px]">{member.email}</span>
      </a>
    </div>
  );
}

function OfficerCard({ name, email }: { name: string; email: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-primary-200 transition-colors">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary/60 to-secondary flex items-center justify-center text-white font-display font-bold text-xs flex-shrink-0">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="font-display font-semibold text-neutral-900 text-sm truncate">
          {name}
        </p>
        <a
          href={`mailto:${email}`}
          className="text-xs text-neutral-400 hover:text-primary transition-colors truncate block"
        >
          {email}
        </a>
      </div>
    </div>
  );
}
