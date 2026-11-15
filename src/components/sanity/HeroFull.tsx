"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import { iconFor } from "@/sanity/icons";
import type { Section } from "@/sanity/types";
import { hrefFor } from "./LinkButton";

type Hero = Extract<Section, { _type: "pageHero" }>;

/**
 * The heading as one span per word (each followed by a space) with the accent colour on words carrying
 * the "emphasis" mark. This is the same DOM the home page always had, so line breaking and sub-pixel
 * text rendering are unchanged; only the source of the accent word differs (a mark instead of string matching).
 */
function WordSpans({ field, locale }: { field: Hero["heading"]; locale: Lang }) {
  const blocks = (pick(field, locale) ?? []) as any[];
  const chars: { ch: string; em: boolean }[] = [];
  for (const b of blocks) for (const c of b?.children ?? []) for (const ch of String(c?.text ?? "")) chars.push({ ch, em: (c?.marks ?? []).includes("emphasis") });
  const words: { text: string; em: boolean }[] = [];
  let cur: { text: string; em: boolean } | null = null;
  for (const { ch, em } of chars) {
    if (ch === " ") { cur = null; continue; }
    if (!cur) { cur = { text: "", em }; words.push(cur); }
    cur.text += ch;
  }
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className={w.em ? "text-primary-400" : ""}>
          {w.text}{" "}
        </span>
      ))}
    </>
  );
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: "easeOut" } }),
};
const anim = (custom: number) => ({ variants: fadeUp, initial: "hidden", animate: "visible", custom });

/**
 * The home page hero (variant "full"). The decorative circles and grid overlay are part of the design
 * and stay in code. The accent word in the heading comes from the "emphasis" mark, not word matching.
 */
export default function HeroFull({ block, locale }: { block: Hero; locale: Lang }) {
  const eyebrow = pick(block.eyebrow, locale);
  const sub = pick(block.subheading, locale);
  const buttons = (block.buttons ?? []).slice(0, 2);
  const badges = (block.badges ?? []).slice(0, 3);

  return (
    <div className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900" />

      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary-500/10 -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-secondary/10 translate-y-1/2 -translate-x-1/3" />
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-primary-800/20 -translate-x-1/2 -translate-y-1/2" />

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 container-max px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl">
          {eyebrow && (
            <motion.div {...anim(0)} className="flex items-center gap-2 mb-6">
              <div className="w-8 h-0.5 bg-primary-400" />
              <span className="text-primary-400 text-sm font-semibold tracking-widest uppercase">{eyebrow}</span>
            </motion.div>
          )}

          <motion.h1
            {...anim(0.15)}
            className="font-display text-4xl sm:text-4xl md:text-4xl lg:text-5xl  xl:text-5xl font-bold text-white leading-[1.4] tracking-tight mb-6"
          >
            <WordSpans field={block.heading} locale={locale} />
          </motion.h1>

          {sub && (
            <motion.p {...anim(0.3)} className="text-lg text-neutral-300 leading-relaxed mb-10 max-w-xl">
              {sub}
            </motion.p>
          )}

          {buttons.length > 0 && (
            <motion.div {...anim(0.45)} className="flex flex-wrap gap-4 mb-12">
              {buttons.map((b, i) => {
                const label = pick(b.link.label, locale);
                if (!label) return null;
                const primary = b.style !== "outline";
                return (
                  <Link
                    key={i}
                    href={hrefFor(b.link)}
                    className={
                      primary
                        ? "inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-white font-display font-semibold hover:bg-primary-600 transition-all duration-200 shadow-lg shadow-primary/30 group"
                        : "inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-white/20 text-white font-display font-semibold hover:border-white/40 hover:bg-white/5 transition-all duration-200"
                    }
                  >
                    {label}
                    {primary && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </Link>
                );
              })}
            </motion.div>
          )}

          {badges.length > 0 && (
            <motion.div {...anim(0.6)} className="flex flex-wrap gap-3">
              {badges.map((b, i) => {
                const Icon = iconFor(b.icon);
                // The heart is the filled accent icon; every other icon is the secondary colour.
                const iconCls = b.icon === "heart" ? "w-4 h-4 text-primary-400 fill-primary-400" : "w-4 h-4 text-secondary";
                return (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
                    {Icon && <Icon className={iconCls} />}
                    <span className="text-sm text-white font-medium">{pick(b.text, locale)}</span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-neutral-50 to-transparent" />
    </div>
  );
}
