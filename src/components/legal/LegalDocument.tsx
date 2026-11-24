import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import { ORG_NAME } from "@/lib/brand";
import { SITE_TIMEZONE, siteUrl } from "@/lib/site";
import { getFeatureStates } from "@/lib/features";
import { FEATURE_KEYS } from "@/lib/features/registry";
import { calendarDateIn, type StatusMap } from "@/content/legal/status";
import type { LegalDoc } from "@/content/legal/types";
import RichText from "./RichText";
import PrintButton, { AutoPrint } from "./PrintButton";

const T = {
  en: { version: "Version", effective: "Effective", all: "All legal pages" },
  es: { version: "Versión", effective: "Vigente desde", all: "Todas las páginas legales" },
} as const;

/** "November 19, 2026" / "19 de noviembre de 2026" (the date is a calendar date: format in UTC). */
export function formatLegalDate(iso: string, locale: "en" | "es") {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale === "es" ? "es-US" : "en-US", {
    timeZone: "UTC", year: "numeric", month: "long", day: "numeric",
  });
}

/**
 * Shared page for Privacy, Terms and Children's policy. Print rules live in the <style> below, so they only
 * exist on pages that render this component (the site navbar/footer are not hidden anywhere else).
 */
export default async function LegalDocument({
  doc, locale, path, autoPrint = false, privacyEmail,
}: { doc: LegalDoc; locale: "en" | "es"; path: string; autoPrint?: boolean; privacyEmail?: string }) {
  const t = T[locale];
  const page = doc[locale];
  // Live feature labels: the same toggles the settings admin controls, so the policy is never ahead of or behind the site.
  const states = await getFeatureStates();
  const statuses = Object.fromEntries(
    FEATURE_KEYS.map((k) => [k, { enabled: states[k].enabled, since: states[k].enabledAt ? calendarDateIn(states[k].enabledAt!, SITE_TIMEZONE) : null }]),
  ) as StatusMap;
  const date = formatLegalDate(doc.effectiveDate, locale);
  const meta = `${t.version} ${doc.version} · ${t.effective} ${date}`;

  return (
    <div className="bg-white">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <AutoPrint enabled={autoPrint} />

      {/* Print-only header */}
      <div className="print-only legal-print-header">
        <BrandMark tone="light" iconHeight={56} iconAlt="" showText={false} />
        <p className="legal-print-org">{ORG_NAME}</p>
        <h1>{page.title}</h1>
        <p>{meta}</p>
        <p>{siteUrl()}{path}</p>
      </div>

      <article className="legal-doc mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/legal" className="text-neutral-500 underline underline-offset-2 hover:text-neutral-800">{t.all}</Link>
          <PrintButton locale={locale} />
        </div>

        <h1 className="no-print-title font-display text-3xl font-bold text-neutral-900 sm:text-4xl">{page.title}</h1>
        <p className="no-print-title mb-8 mt-2 text-sm text-neutral-500">{meta}</p>

        <div className="space-y-4 text-base leading-relaxed text-neutral-800">
          {page.blocks.map((b, i) => {
            if (b.t === "h2") return <h2 key={i} className="legal-h2 pt-6 font-display text-xl font-semibold text-neutral-900">{b.text}</h2>;
            if (b.t === "p") return <p key={i}><RichText text={b.text} locale={locale} privacyEmail={privacyEmail} statuses={statuses} /></p>;
            if (b.t === "ul")
              return (
                <ul key={i} className="list-disc space-y-2 pl-6">
                  {b.items.map((it, j) => <li key={j}><RichText text={it} locale={locale} privacyEmail={privacyEmail} statuses={statuses} /></li>)}
                </ul>
              );
            return (
              <div key={i} className="overflow-x-auto">
                <table className="legal-table w-full border-collapse text-left text-sm">
                  <thead>
                    <tr>{b.head.map((h, j) => <th key={j} className="border-b-2 border-neutral-300 px-3 py-2 font-semibold text-neutral-900">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>{r.map((c, k) => <td key={k} className={`border-b border-neutral-200 px-3 py-2 align-top ${k === 0 ? "font-medium text-neutral-900" : ""}`}><RichText text={c} locale={locale} privacyEmail={privacyEmail} statuses={statuses} /></td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </article>
    </div>
  );
}

const PRINT_CSS = `
.print-only{display:none}
@page{size:Letter;margin:0.75in 0.75in 0.9in;@bottom-center{content:counter(page);font-size:10pt;color:#000}}
@media print{
  header, footer, .no-print, .no-print-title{display:none !important}
  .print-only{display:block !important}
  html, body{background:#fff !important}
  .legal-doc{max-width:none !important;padding:0 !important;margin:0 !important}
  .legal-doc, .legal-doc *{color:#000 !important;background:transparent !important;box-shadow:none !important}
  .legal-doc{font-size:11pt;line-height:1.45}
  .legal-doc a{text-decoration:underline}
  .legal-doc a.print-url::after{content:" (" attr(href) ")";font-size:9pt;word-break:break-all}
  .legal-doc h2, .legal-h2{break-after:avoid;page-break-after:avoid;padding-top:14pt}
  .legal-doc h2 + p{break-before:avoid;page-break-before:avoid}
  .legal-doc li, .legal-doc tr, .legal-doc h2 + p{break-inside:avoid;page-break-inside:avoid}
  .legal-doc thead{display:table-header-group}
  .legal-doc table{width:100%}
  .legal-doc th, .legal-doc td{border-color:#000 !important}
  .legal-print-header{border-bottom:1.5pt solid #000;padding-bottom:10pt;margin-bottom:14pt;color:#000}
  .legal-print-header h1{font-size:20pt;font-weight:700;margin:8pt 0 2pt;color:#000}
  .legal-print-header p{margin:0;font-size:10pt;color:#000}
  .legal-print-header .legal-print-org{font-size:12pt;font-weight:600;margin-top:6pt}
}
`;
