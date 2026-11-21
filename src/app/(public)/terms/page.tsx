import type { Metadata } from "next";
import { getLocaleCookie } from "@/lib/locale";
import LegalDocument from "@/components/legal/LegalDocument";
import { terms } from "@/content/legal/terms";
import type { Lang } from "@/types";

export const dynamic = "force-dynamic"; // language comes from a cookie

export async function generateMetadata(): Promise<Metadata> {
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  return { title: terms[locale].title, alternates: { canonical: "/terms" } };
}

export default async function Page({ searchParams }: { searchParams: { print?: string } }) {
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  return <LegalDocument doc={terms} locale={locale} path="/terms" autoPrint={searchParams.print === "1"} />;
}
