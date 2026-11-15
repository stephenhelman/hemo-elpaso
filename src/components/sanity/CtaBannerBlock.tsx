"use client";

import Section from "@/components/layout/Section";
import { useSiteFlags } from "@/context/SiteFlagsContext";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import { iconFor } from "@/sanity/icons";
import type { Section as SectionData } from "@/sanity/types";
import LinkButton from "./LinkButton";

type Cta = Extract<SectionData, { _type: "ctaBanner" }>;

export default function CtaBannerBlock({ block, locale }: { block: Cta; locale: Lang }) {
  const { registrationOpen } = useSiteFlags();
  if (block.showIfRegistrationOpen && !registrationOpen) return null;

  const bg = block.background ?? "white";
  const onPrimary = bg === "primary";
  const Icon = iconFor(block.icon);
  const sub = pick(block.subheading, locale);
  const buttons = (block.buttons ?? []).filter((b) => !b.showIfRegistrationOpen || registrationOpen);

  return (
    <Section background={bg}>
      <div className="max-w-2xl mx-auto text-center">
        {Icon && (
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 ${onPrimary ? "bg-white/10" : "bg-primary-50"}`}>
            <Icon className={`w-7 h-7 ${onPrimary ? "text-white" : "text-primary"}`} />
          </div>
        )}
        {/* Banners with an icon use the smaller heading (Scholarships); icon-less ones the larger (About, Get Involved). */}
        <h2 className={`font-display text-3xl ${Icon ? "" : "sm:text-4xl"} font-bold mb-4 ${onPrimary ? "text-white" : "text-neutral-900"}`}>
          {pick(block.heading, locale)}
        </h2>
        {sub && <p className={`text-lg mb-8 leading-relaxed ${onPrimary ? "text-primary-100" : "text-neutral-500"}`}>{sub}</p>}
        {buttons.length > 0 && (
          <div className="flex flex-wrap gap-4 justify-center">
            {buttons.map((b, i) => (
              <LinkButton key={i} link={b.link} style={b.style} icon={b.icon} tone={onPrimary ? "onPrimary" : "light"} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
