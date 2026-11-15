"use client";

import { Heart } from "lucide-react";
import Section from "@/components/layout/Section";
import { FOUNDING_YEAR } from "@/lib/site";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import type { Section as SectionData } from "@/sanity/types";
import { HeadingText, RichText } from "./RichText";
import PersonAvatar from "./PersonAvatar";

type Block = Extract<SectionData, { _type: "textWithAside" }>;

export default function TextWithAsideBlock({ block, locale }: { block: Block; locale: Lang }) {
  const eyebrow = pick(block.eyebrow, locale);
  const aside = block.aside ?? "both";
  const credit = block.credit;
  const creditTitle = pick(block.creditTitle, locale) ?? (credit ? pick(credit.office, locale) ?? pick(credit.title, locale) : undefined);
  const showYear = aside === "foundingYear" || aside === "both";
  const showList = aside === "pastPresidents" || aside === "both";
  const caption = pick(block.foundedCaption, locale);

  return (
    <Section background="white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          {eyebrow && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-0.5 bg-primary-400" />
              <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">{eyebrow}</span>
            </div>
          )}
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 leading-[1.2] mb-6">
            <HeadingText field={block.heading} locale={locale} />
          </h2>
          <RichText field={block.body} locale={locale} className="space-y-4 text-neutral-600 leading-relaxed [&_p]:mb-0" />
          {credit && (
            <div className="flex items-center gap-3 mt-8 pt-8 border-t border-neutral-100">
              {credit.photo?.v ? (
                <PersonAvatar
                  person={credit}
                  locale={locale}
                  size={128}
                  className="w-12 h-12 rounded-full bg-primary-50 border-2 border-primary-200 flex items-center justify-center flex-shrink-0 text-primary font-display font-bold text-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-50 border-2 border-primary-200 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-primary fill-primary" />
                </div>
              )}
              <div>
                <p className="font-display font-bold text-neutral-900">{credit.name}</p>
                {creditTitle && <p className="text-sm text-neutral-500">{creditTitle}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {showYear && (
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-8 text-white">
              <p className="font-display text-7xl font-bold opacity-20 leading-none mb-2">{FOUNDING_YEAR}</p>
              <p className="font-display text-2xl font-bold mb-2">{pick(block.foundedLabel, locale)}</p>
              {caption && <p className="text-primary-100 text-sm">{caption}</p>}
            </div>
          )}
          {showList && (block.pastPresidents?.length ?? 0) > 0 && (
            <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
              <h3 className="font-display font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <span className="text-lg">🏛️</span>
                {pick(block.pastPresidentsHeading, locale)}
              </h3>
              <ul className="space-y-2">
                {block.pastPresidents!.map((p) => (
                  <li key={p._id} className="flex items-center gap-2 text-sm text-neutral-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {p.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
