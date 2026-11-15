"use client";

import Link from "next/link";
import Section from "@/components/layout/Section";
import HoepCard from "@/components/ui/HoepCard";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import { iconFor } from "@/sanity/icons";
import type { Section as SectionData } from "@/sanity/types";
import SectionHeaderView from "./SectionHeaderView";

type Block = Extract<SectionData, { _type: "cardGrid" }>;
type Card = NonNullable<Block["cards"]>[number];

// Tailwind needs literal class names.
const GRID: Record<string, Record<number, string>> = {
  emojiCard: {
    2: "grid grid-cols-1 md:grid-cols-2 gap-6",
    3: "grid grid-cols-1 md:grid-cols-3 gap-6",
    4: "grid grid-cols-1 md:grid-cols-4 gap-6",
  },
  iconCircle: {
    2: "grid grid-cols-1 sm:grid-cols-2 gap-6",
    3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
    4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6",
  },
  iconSquareLink: {
    2: "grid grid-cols-1 sm:grid-cols-2 gap-6",
    3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
    4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6",
  },
};
const CIRCLE: Record<string, string> = {
  primary: "bg-primary-50 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent-dark",
  neutral: "bg-neutral-100 text-neutral-600",
};

/**
 * One or more card grids sharing a single background band. A grid marked
 * "continues previous" is placed in the previous grid's section (live About page:
 * Mission/Objective/Goal and What We Do share one band).
 */
export default function CardGridBlock({ blocks, locale }: { blocks: Block[]; locale: Lang }) {
  return (
    <Section background={blocks[0].background ?? "neutral"}>
      {blocks.map((b, i) => (
        <div key={b._key} className={i < blocks.length - 1 ? "mb-20" : undefined}>
          <SectionHeaderView header={b.header} locale={locale} />
          <div className={GRID[b.variant ?? "emojiCard"]?.[b.columns ?? 3] ?? GRID.emojiCard[3]}>
            {(b.cards ?? []).map((c, j) => (
              <CardView key={c._key ?? j} card={c} variant={b.variant ?? "emojiCard"} locale={locale} />
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
}

function CardView({ card, variant, locale }: { card: Card; variant: string; locale: Lang }) {
  const Icon = iconFor(card.icon);
  const title = pick(card.title, locale);
  const body = pick(card.body, locale);
  const accent = CIRCLE[card.accent ?? "primary"] ?? CIRCLE.primary;

  if (variant === "iconCircle") {
    return (
      <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all duration-200">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${accent}`}>
          {Icon ? <Icon className="w-6 h-6" /> : <span className="text-2xl">{card.emoji}</span>}
        </div>
        <h3 className="font-display font-bold text-neutral-900 mb-2">{title}</h3>
        {body && <p className="text-sm text-neutral-500 leading-relaxed">{body}</p>}
      </div>
    );
  }

  if (variant === "iconSquareLink") {
    const label = pick(card.link?.label, locale);
    const link = card.link;
    const cta = link?.value && label ? (
      link.type === "internal" ? (
        <Link href={link.value} className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-600 transition-colors">
          {label} →
        </Link>
      ) : (
        <a
          href={link.type === "phone" ? `tel:${link.value}` : link.type === "email" ? `mailto:${link.value}` : link.value}
          {...(link.type === "external" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-600 transition-colors"
        >
          {label} →
        </a>
      )
    ) : null;
    return (
      <div className="flex flex-col p-6 rounded-2xl bg-white border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all duration-200">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${accent}`}>
          {Icon ? <Icon className="w-6 h-6" /> : <span className="text-2xl">{card.emoji}</span>}
        </div>
        <h3 className="font-display font-bold text-neutral-900 text-lg mb-2">{title}</h3>
        {body && <p className="text-neutral-500 text-sm leading-relaxed mb-5 flex-1">{body}</p>}
        {cta}
      </div>
    );
  }

  return (
    <HoepCard className="text-center">
      <div className="text-4xl mb-4">{card.emoji ?? (Icon ? <Icon className="w-8 h-8 mx-auto text-primary" /> : null)}</div>
      <h3 className="font-display font-bold text-neutral-900 text-lg mb-3">{title}</h3>
      {body && <p className="text-neutral-500 text-sm leading-relaxed">{body}</p>}
    </HoepCard>
  );
}
