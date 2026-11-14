"use client";

import Section from "@/components/layout/Section";
import type { Lang } from "@/types";
import type { Section as SectionData } from "@/sanity/types";
import SectionHeaderView from "./SectionHeaderView";
import { RichText } from "./RichText";

type Rich = Extract<SectionData, { _type: "richText" }>;

export default function RichTextBlock({ block, locale }: { block: Rich; locale: Lang }) {
  return (
    <Section background={block.background ?? "white"}>
      <SectionHeaderView header={block.header} locale={locale} />
      <RichText
        field={block.body}
        locale={locale}
        className={`text-neutral-600 leading-relaxed mx-auto ${block.width === "wide" ? "max-w-4xl" : "max-w-2xl"}`}
      />
    </Section>
  );
}
