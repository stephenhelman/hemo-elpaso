"use client";

import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import type { SectionHeaderData } from "@/sanity/types";
import { HeadingText } from "./RichText";

/** Eyebrow rule + heading + sub, in the style used across the site. */
export default function SectionHeaderView({ header, locale }: { header?: SectionHeaderData; locale: Lang }) {
  if (!header) return null;
  const eyebrow = pick(header.eyebrow, locale);
  const sub = pick(header.subheading, locale);
  const center = header.align !== "left";
  return (
    <div className={`${center ? "text-center" : ""} mb-12`}>
      {eyebrow && (
        <div className={`flex items-center ${center ? "justify-center" : ""} gap-2 mb-4`}>
          <div className="w-8 h-0.5 bg-primary-400" />
          <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">{eyebrow}</span>
          {center && <div className="w-8 h-0.5 bg-primary-400" />}
        </div>
      )}
      {header.heading && (
        <h2 className="font-display text-3xl font-bold text-neutral-900 mb-3">
          <HeadingText field={header.heading} locale={locale} />
        </h2>
      )}
      {sub && <p className={`text-neutral-500 ${center ? "max-w-xl mx-auto" : ""}`}>{sub}</p>}
    </div>
  );
}
