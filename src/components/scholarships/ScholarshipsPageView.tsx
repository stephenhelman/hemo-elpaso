"use client";

import { useLanguage } from "@/context/LanguageContext";
import SectionRenderer from "@/components/sanity/SectionRenderer";
import ScholarshipCardBlock, { EligibilityList } from "@/components/sanity/ScholarshipCardBlock";
import type { ScholarshipsPageData } from "@/sanity/types";

type Status = "comingSoon" | "open" | "closed";

/**
 * Client view of the Scholarships page. Both languages arrive in `data`; the
 * language comes from LanguageContext, so switching is instant (no refetch).
 * `status` is the effective status, computed on the server from the deadline.
 */
export default function ScholarshipsPageView({ data, status }: { data: ScholarshipsPageData; status: Status }) {
  const { locale } = useLanguage();
  const [first, ...rest] = data.sections;
  // The scholarship card sits right after the hero (or first, if the page has no hero).
  const heroFirst = first?._type === "pageHero";
  const head = heroFirst ? [first] : [];
  const tail = heroFirst ? rest : data.sections;

  return (
    <>
      {head.map((s) => (
        <SectionRenderer key={s._key} section={s} locale={locale} />
      ))}
      {data.scholarship && <ScholarshipCardBlock scholarship={data.scholarship} status={status} locale={locale} />}
      {data.scholarship && status === "open" && <EligibilityList scholarship={data.scholarship} locale={locale} />}
      {tail.map((s) => (
        <SectionRenderer key={s._key} section={s} locale={locale} />
      ))}
    </>
  );
}
