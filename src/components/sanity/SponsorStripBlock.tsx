"use client";

import Section from "@/components/layout/Section";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import type { Section as SectionData } from "@/sanity/types";
import { visibleSponsors } from "@/sanity/helpers/sponsors";
import SectionHeaderView from "./SectionHeaderView";
import SponsorLogo from "./SponsorLogo";

type Block = Extract<SectionData, { _type: "sponsorStrip" }>;

export default function SponsorStripBlock({ block, locale }: { block: Block; locale: Lang }) {
  const sponsors = visibleSponsors(block.sponsors);
  if (sponsors.length === 0) return null; // no sponsors, no section (no empty heading)
  const showNames = block.showNames === true;

  return (
    <Section background="white" id="sponsors">
      <SectionHeaderView header={block.header} locale={locale} />
      {block.layout === "row" ? (
        <ul className="flex flex-wrap items-start justify-center gap-x-8 gap-y-6">
          {sponsors.map((s) => (
            <li key={s._id}>
              <SponsorLogo sponsor={s} locale={locale} height={48} showName={showNames} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sponsors.map((s) => {
            const desc = pick(s.description, locale);
            return (
              <li key={s._id} className="flex flex-col">
                <SponsorLogo sponsor={s} locale={locale} height={64} showName={showNames} />
                {showNames && s.sinceYear ? (
                  <span className="text-xs text-neutral-500 text-center mt-0.5">
                    {locale === "es" ? `Desde ${s.sinceYear}` : `Since ${s.sinceYear}`}
                  </span>
                ) : null}
                {showNames && desc ? <p className="text-sm text-neutral-500 text-center mt-2 line-clamp-3">{desc}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
