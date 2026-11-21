import type { Metadata } from "next";
import Link from "next/link";
import { Printer } from "lucide-react";
import { getLocaleCookie } from "@/lib/locale";
import { privacy } from "@/content/legal/privacy";
import { terms } from "@/content/legal/terms";
import { children } from "@/content/legal/children";
import { formatLegalDate } from "@/components/legal/LegalDocument";
import type { Lang } from "@/types";

export const dynamic = "force-dynamic";

const T = {
  en: { title: "Legal", intro: "How HOEP handles your information, and the rules for using this site.", open: "Read", print: "Print / Save as PDF" },
  es: { title: "Información legal", intro: "Cómo maneja HOEP su información y las reglas para usar este sitio.", open: "Leer", print: "Imprimir / Guardar como PDF" },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  return { title: T[locale].title, alternates: { canonical: "/legal" } };
}

export default async function LegalIndex() {
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  const t = T[locale];
  const items = [
    { href: "/privacy", doc: privacy },
    { href: "/terms", doc: terms },
    { href: "/children", doc: children },
  ];
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-3xl font-bold text-neutral-900 sm:text-4xl">{t.title}</h1>
        <p className="mb-8 mt-2 text-neutral-600">{t.intro}</p>
        <ul className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200">
          {items.map(({ href, doc }) => (
            <li key={href} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <Link href={href} className="font-display text-lg font-semibold text-neutral-900 underline-offset-2 hover:underline">
                  {doc[locale].title}
                </Link>
                <p className="text-xs text-neutral-500">
                  {locale === "es" ? "Versión" : "Version"} {doc.version} · {formatLegalDate(doc.effectiveDate, locale)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={href} className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
                  {t.open}
                </Link>
                {/* Opens the page and the print dialog (AutoPrint), in the language showing. */}
                <Link href={`${href}?print=1`} className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
                  <Printer className="h-4 w-4" aria-hidden="true" /> {t.print}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
