"use client";

import { Heart, Star } from "lucide-react";
import Section from "@/components/layout/Section";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import type { Section as SectionData } from "@/sanity/types";
import { RichText } from "./RichText";
import PersonAvatar from "./PersonAvatar";

type Block = Extract<SectionData, { _type: "featuredPerson" }>;

export default function FeaturedPersonBlock({ block, locale }: { block: Block; locale: Lang }) {
  const person = block.person;
  if (!person) return null;
  const eyebrow = pick(block.eyebrow, locale);
  const title = pick(person.title, locale) ?? pick(person.office, locale);
  const subtitle = pick(block.subtitle, locale);
  const quote = pick(block.quote, locale);
  const badges = (block.badges ?? []).map((b) => pick(b, locale)).filter(Boolean) as string[];

  return (
    <Section background="white">
      {eyebrow && (
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-8 h-0.5 bg-primary-400" />
          <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">{eyebrow}</span>
          <div className="w-8 h-0.5 bg-primary-400" />
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 p-8 sm:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary-500/10 -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-secondary/10 translate-y-1/2 -translate-x-1/3" />
          <div className="relative z-10 flex flex-col sm:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              <div className="relative">
                <PersonAvatar
                  person={person}
                  locale={locale}
                  initialsStyle="firstLast"
                  size={400}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center font-display font-bold text-white text-3xl sm:text-4xl"
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg">
                  <Star className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-1">{person.name}</h2>
              {title && <p className="text-primary-400 font-semibold mb-1">{title}</p>}
              {subtitle && <p className="text-neutral-400 text-sm mb-6">{subtitle}</p>}
              {quote && (
                <blockquote className="border-l-4 border-primary-400 pl-4 mb-6">
                  <p className="text-white text-lg italic leading-relaxed">{quote}</p>
                </blockquote>
              )}
              <RichText field={block.body} locale={locale} className="text-neutral-300 leading-relaxed mb-8" />
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-xs font-medium"
                    >
                      <Heart className="w-3 h-3 text-primary-400 fill-primary-400" />
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
