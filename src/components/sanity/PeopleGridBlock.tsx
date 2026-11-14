"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import Section from "@/components/layout/Section";
import { useSiteInfo } from "@/context/SiteSettingsContext";
import { ORG_ABBR } from "@/lib/site";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import type { PersonData, Section as SectionData } from "@/sanity/types";
import SectionHeaderView from "./SectionHeaderView";

type Grid = Extract<SectionData, { _type: "peopleGrid" }>;

/** Fixed group order. Empty groups are not rendered. */
const GROUP_ORDER = ["officer", "memberAtLarge", "advisor", "founder", "pastPresident", "honoree"] as const;
const GROUP_LABELS: Record<string, { en: string; es: string }> = {
  officer: { en: "Officers", es: "Funcionarios" },
  memberAtLarge: { en: "Members at Large", es: "Vocales" },
  advisor: { en: "Advisors", es: "Asesores" },
  founder: { en: "Founders", es: "Fundadores" },
  pastPresident: { en: "Past Presidents", es: "Pasados Presidentes" },
  honoree: { en: "In Memory", es: "En Memoria" },
};
const UI = {
  en: { send: "Send a message" },
  es: { send: "Enviar un mensaje" },
};

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("");

// Photos are intentionally not rendered yet: assets in a private dataset are not
// publicly fetchable. Initials are shown (as on the live site today).
const subtitle = (p: PersonData, locale: Lang) => pick(p.office, locale) ?? pick(p.title, locale);

export default function PeopleGridBlock({ block, locale }: { block: Grid; locale: Lang }) {
  const layout = block.layout ?? "card";
  const people = block.people ?? [];

  if (layout === "contact") {
    return (
      <Section background="neutral" id="contact">
        <SectionHeaderView header={block.header} locale={locale} />
        <div className="grid grid-cols-1 gap-6 max-w-sm mx-auto">
          {people.map((p) => (
            <ContactCard key={p._id} person={p} locale={locale} />
          ))}
        </div>
      </Section>
    );
  }

  const groups = GROUP_ORDER.map((g) => ({
    key: g,
    people: people.filter((p) => p.group === g).sort((a, b) => (a.order ?? 100) - (b.order ?? 100)),
  })).filter((g) => g.people.length > 0);

  return (
    <Section background="white">
      <SectionHeaderView header={block.header} locale={locale} />
      {groups.map((g, i) => (
        <div key={g.key} className={i < groups.length - 1 ? "mb-12" : undefined}>
          <h3 className="font-display font-bold text-neutral-400 text-xs uppercase tracking-widest mb-4">
            {GROUP_LABELS[g.key][locale]}
          </h3>
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${layout === "compact" ? "gap-3" : "gap-4"}`}>
            {g.people.map((p) => (layout === "compact" ? <CompactCard key={p._id} person={p} locale={locale} /> : <Card key={p._id} person={p} locale={locale} />))}
          </div>
        </div>
      ))}
    </Section>
  );
}

function Card({ person, locale }: { person: PersonData; locale: Lang }) {
  const sub = subtitle(person, locale);
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-primary-200 hover:shadow-sm transition-all duration-200">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-display font-bold text-lg mb-4">
        {initials(person.name)}
      </div>
      <h3 className="font-display font-bold text-neutral-900 text-sm mb-0.5">{person.name}</h3>
      {sub && <p className="text-primary-600 text-xs font-semibold mb-3">{sub}</p>}
    </div>
  );
}

function CompactCard({ person, locale }: { person: PersonData; locale: Lang }) {
  const sub = subtitle(person, locale);
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-primary-200 transition-colors">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary/60 to-secondary flex items-center justify-center text-white font-display font-bold text-xs flex-shrink-0">
        {initials(person.name)}
      </div>
      <div className="min-w-0">
        <p className="font-display font-semibold text-neutral-900 text-sm truncate">{person.name}</p>
        {sub && <p className="text-xs text-neutral-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}

/** Name, office, the ORG phone and a link to the contact form. Never an email address. */
function ContactCard({ person, locale }: { person: PersonData; locale: Lang }) {
  const site = useSiteInfo();
  const office = pick(person.office, locale) ?? pick(person.title, locale);
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-neutral-200 hover:border-primary-200 hover:shadow-sm transition-all duration-200">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-display font-bold text-lg mb-4">
        {initials(person.name)}
      </div>
      <h3 className="font-display font-bold text-neutral-900 mb-0.5">{person.name}</h3>
      {office && <p className="text-primary-600 text-xs font-semibold mb-4">{`${office}, ${ORG_ABBR}`}</p>}
      <div className="space-y-2 w-full">
        <Link href="/contact" className="flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-primary transition-colors">
          <Mail className="w-4 h-4" />
          {UI[locale].send}
        </Link>
        <a href={`tel:${site.phone.e164}`} className="flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-primary transition-colors">
          <Phone className="w-4 h-4" />
          {site.phone.display}
        </a>
      </div>
    </div>
  );
}
