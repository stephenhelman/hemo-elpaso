"use client";

import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import type { Section } from "@/sanity/types";
import { HeadingText } from "./RichText";
import HeroFull from "./HeroFull";

type Hero = Extract<Section, { _type: "pageHero" }>;

/** compact = the hero used on About/Resources/Contact/Get Involved/Scholarships. */
export default function PageHeroBlock({ block, locale }: { block: Hero; locale: Lang }) {
  if (block.variant === "full") return <HeroFull block={block} locale={locale} />;
  const variant = block.variant ?? "compact";
  const eyebrow = pick(block.eyebrow, locale);
  const sub = pick(block.subheading, locale);
  const titleOnly = variant === "titleOnly";

  return (
    <div className={`relative bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 ${titleOnly ? "py-16" : "py-24"}`}>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary-500/10 -translate-y-1/2 translate-x-1/3" />
      {block.decoration !== "one" && (
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-secondary/10 translate-y-1/2 -translate-x-1/3" />
      )}
      <div className="container-max px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={titleOnly || block.width === "wide" ? "max-w-3xl" : "max-w-2xl"}>
          {eyebrow && !titleOnly && (
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-0.5 bg-primary-400" />
              <span className="text-primary-400 text-sm font-semibold tracking-widest uppercase">{eyebrow}</span>
            </div>
          )}
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-[1.2] mb-6">
            <HeadingText field={block.heading} locale={locale} />
          </h1>
          {sub && <p className={`text-lg text-neutral-300 leading-relaxed ${block.width === "wide" ? "max-w-2xl" : ""}`}>{sub}</p>}
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-neutral-50 to-transparent" />
    </div>
  );
}
