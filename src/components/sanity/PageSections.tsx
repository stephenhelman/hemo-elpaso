"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { Section } from "@/sanity/types";
import SectionRenderer from "./SectionRenderer";

/** Renders a page's sections in order. Both languages are already in the props; the language comes from context. */
export default function PageSections({ sections }: { sections: Section[] }) {
  const { locale } = useLanguage();
  return (
    <>
      {sections.map((s) => (
        <SectionRenderer key={s._key} section={s} locale={locale} />
      ))}
    </>
  );
}
