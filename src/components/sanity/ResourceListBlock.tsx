"use client";

import { ExternalLink, MapPin, Phone } from "lucide-react";
import Section from "@/components/layout/Section";
import HoepCard from "@/components/ui/HoepCard";
import { avatarColors, colorMap } from "@/lib/statColorConfig";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import { iconFor } from "@/sanity/icons";
import { DEFAULT_LINK_LABEL } from "@/sanity/resourcesSource";
import { categoryAnchor } from "@/sanity/helpers/anchors";
import type { ResourceItem, Section as SectionData } from "@/sanity/types";
import SectionHeaderView from "./SectionHeaderView";
import { RichText } from "./RichText";

type List = Extract<SectionData, { _type: "resourceList" }>;

const UI = {
  en: { what: "What is it?" },
  es: { what: "¿Qué es?" },
};

const nameOf = (r: ResourceItem, locale: Lang) => (locale === "es" && r.nameEs ? r.nameEs : r.name);
const accentOf = (r: ResourceItem) => (r.accent && r.accent in colorMap ? r.accent : "primary");

/** External links always open in a new tab with noopener; internal ones stay in the tab. */
function linkProps(r: ResourceItem): { href: string; external: boolean } | null {
  const l = r.link;
  if (!l?.value) return null;
  switch (l.type) {
    case "internal":
      return { href: l.value, external: false };
    case "phone":
      return { href: `tel:${l.value}`, external: false };
    case "email":
      return { href: `mailto:${l.value}`, external: false };
    default:
      return { href: l.value, external: true };
  }
}
const targetProps = (external: boolean) => (external ? { target: "_blank", rel: "noopener noreferrer" } : {});
const labelOf = (r: ResourceItem, locale: Lang) => pick(r.link?.label, locale) ?? DEFAULT_LINK_LABEL[locale];

// Tailwind needs literal class names, so every (layout, columns) pair is spelled out.
const GRID: Record<string, Record<number, string>> = {
  rich: { 2: "grid grid-cols-1 lg:grid-cols-2 gap-6", 3: "grid grid-cols-1 lg:grid-cols-3 gap-6" },
  org: { 2: "grid grid-cols-1 sm:grid-cols-2 gap-6", 3: "grid grid-cols-1 sm:grid-cols-3 gap-6" },
  provider: { 2: "grid grid-cols-1 md:grid-cols-2 gap-6", 3: "grid grid-cols-1 md:grid-cols-3 gap-6" },
  program: {
    2: "grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto",
    3: "grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto",
  },
  linkCard: {
    2: "grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto",
    3: "grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto",
  },
};
const BACKGROUND: Record<string, "white" | "neutral"> = {
  rich: "neutral",
  org: "white",
  provider: "neutral",
  program: "white",
  linkCard: "neutral",
};

export default function ResourceListBlock({ block, locale, anchorId }: { block: List; locale: Lang; anchorId?: string }) {
  const layout = block.layout ?? "org";
  const items = block.items ?? [];
  if (items.length === 0) return null;
  const cols = block.columns === 2 ? 2 : 3;

  return (
    // scroll-mt clears the 64px sticky header when the page is opened at this anchor
    <Section background={BACKGROUND[layout] ?? "white"} id={anchorId ?? categoryAnchor(block.category)} className="scroll-mt-16">
      <SectionHeaderView header={block.header} locale={locale} />
      <div className={GRID[layout]?.[cols] ?? GRID.org[cols]}>
        {items.map((r) => {
          switch (layout) {
            case "rich":
              return <RichCard key={r._id} r={r} locale={locale} />;
            case "provider":
              return <ProviderCard key={r._id} r={r} locale={locale} />;
            case "program":
              return <ProgramCard key={r._id} r={r} locale={locale} />;
            case "linkCard":
              return <LinkCard key={r._id} r={r} locale={locale} />;
            default:
              return <OrgCard key={r._id} r={r} locale={locale} />;
          }
        })}
      </div>
    </Section>
  );
}

function RichCard({ r, locale }: { r: ResourceItem; locale: Lang }) {
  const colors = colorMap[accentOf(r)];
  const accent = accentOf(r);
  const link = linkProps(r);
  const facts = (r.facts ?? []).map((f) => pick(f, locale)).filter(Boolean) as string[];
  return (
    <HoepCard className="flex flex-col">
      <div className="flex items-center gap-4 mb-5">
        <div className={`w-14 h-14 rounded-2xl ${colors.avatar} flex items-center justify-center flex-shrink-0`}>
          <span className="font-display font-bold text-white text-sm">{r.abbreviation}</span>
        </div>
        <h3 className="font-display font-bold text-neutral-900 text-lg leading-snug">{nameOf(r, locale)}</h3>
      </div>
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">{UI[locale].what}</p>
      {r.body && pick(r.body, locale) ? (
        <RichText field={r.body} locale={locale} className="text-neutral-600 text-sm leading-relaxed mb-5" />
      ) : (
        <p className="text-neutral-600 text-sm leading-relaxed mb-5">{pick(r.summary, locale)}</p>
      )}
      <ul className="space-y-2 mb-6">
        {facts.map((fact) => (
          <li key={fact} className="flex items-start gap-2 text-sm text-neutral-600">
            <div
              className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                accent === "primary" ? "bg-primary" : accent === "secondary" ? "bg-secondary" : "bg-accent"
              }`}
            />
            {fact}
          </li>
        ))}
      </ul>
      {link && (
        <div className="mt-auto">
          <a
            href={link.href}
            {...targetProps(link.external)}
            className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border ${colors.bg} ${colors.text} ${colors.border} hover:opacity-80 transition-opacity`}
          >
            {labelOf(r, locale)}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </HoepCard>
  );
}

function OrgCard({ r, locale }: { r: ResourceItem; locale: Lang }) {
  const link = linkProps(r);
  const inner = (
    <>
      <div className={`w-14 h-14 rounded-2xl ${avatarColors[accentOf(r)]} flex items-center justify-center flex-shrink-0`}>
        <span className="font-display font-bold text-white text-xs">{r.abbreviation}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-bold text-neutral-900 text-sm leading-snug group-hover:text-primary transition-colors">
            {nameOf(r, locale)}
          </h3>
          <ExternalLink className="w-4 h-4 text-neutral-300 group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
        </div>
        <p className="text-neutral-500 text-sm leading-relaxed">{pick(r.summary, locale)}</p>
      </div>
    </>
  );
  const cls =
    "flex gap-4 p-6 rounded-2xl border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all duration-200 group bg-white";
  return link ? (
    <a href={link.href} {...targetProps(link.external)} className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function ProviderCard({ r, locale }: { r: ResourceItem; locale: Lang }) {
  const link = linkProps(r);
  return (
    <HoepCard className="flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl ${avatarColors[accentOf(r)]} flex items-center justify-center flex-shrink-0`}>
          <span className="font-display font-bold text-white text-xs">{r.abbreviation}</span>
        </div>
        <div>
          <p className="text-xs text-neutral-400 font-medium">{pick(r.kicker, locale)}</p>
          <h3 className="font-display font-bold text-neutral-900 text-sm leading-snug">{nameOf(r, locale)}</h3>
        </div>
      </div>
      <p className="text-neutral-500 text-sm leading-relaxed mb-4">{pick(r.summary, locale)}</p>
      <div className="space-y-2 mb-5 mt-auto">
        {r.address && (
          <div className="flex items-start gap-2 text-xs text-neutral-500">
            <MapPin className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 mt-0.5" />
            <span>{r.address}</span>
          </div>
        )}
        {r.phone?.display && (
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Phone className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
            {r.phone.e164 ? (
              <a href={`tel:${r.phone.e164}`} className="hover:text-primary transition-colors">
                {r.phone.display}
              </a>
            ) : (
              <span>{r.phone.display}</span>
            )}
          </div>
        )}
      </div>
      {link && (
        <a
          href={link.href}
          {...targetProps(link.external)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-600 transition-colors"
        >
          {labelOf(r, locale)}
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </HoepCard>
  );
}

function ProgramCard({ r, locale }: { r: ResourceItem; locale: Lang }) {
  const link = linkProps(r);
  const Icon = iconFor(r.icon) ?? iconFor("sun")!;
  const tags = (r.meta ?? []).map((m) => pick(m.value, locale)).filter(Boolean) as string[];
  return (
    <div className="relative rounded-2xl border border-neutral-200 overflow-hidden bg-white hover:border-primary-200 hover:shadow-md transition-all duration-200">
      <div className="h-2 bg-gradient-to-r from-primary-500 to-secondary" />
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-neutral-900">{nameOf(r, locale)}</h3>
            <p className="text-xs text-neutral-400">{pick(r.kicker, locale)}</p>
          </div>
        </div>
        <p className="text-neutral-600 text-sm leading-relaxed mb-5">{pick(r.summary, locale)}</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {tags.map((label, i) => (
            <span
              key={i}
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                i === tags.length - 1
                  ? "bg-secondary/10 text-secondary-700 border border-secondary/20"
                  : "bg-neutral-100 text-neutral-600 border border-neutral-200"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
        {link && (
          <a
            href={link.href}
            {...targetProps(link.external)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-600 transition-colors"
          >
            {labelOf(r, locale)}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function LinkCard({ r, locale }: { r: ResourceItem; locale: Lang }) {
  const link = linkProps(r);
  const Icon = iconFor(r.icon);
  return (
    <HoepCard>
      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary mb-4">
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <h3 className="font-display font-bold text-neutral-900 mb-2">{nameOf(r, locale)}</h3>
      <p className="text-neutral-500 text-sm leading-relaxed mb-5 flex-1">{pick(r.summary, locale)}</p>
      {link && (
        <a
          href={link.href}
          {...targetProps(link.external)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-600 transition-colors"
        >
          {labelOf(r, locale)}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </HoepCard>
  );
}
