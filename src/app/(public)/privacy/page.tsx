import type { Metadata } from "next";
import { getLocaleCookie } from "@/lib/locale";
import { getPrivacyEmail } from "@/lib/email-routing";
import LegalDocument from "@/components/legal/LegalDocument";
import { privacy } from "@/content/legal/privacy";
import type { Lang } from "@/types";

export const dynamic = "force-dynamic"; // language comes from a cookie

export async function generateMetadata(): Promise<Metadata> {
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  return { title: privacy[locale].title, alternates: { canonical: "/privacy" } };
}

export default async function Page({ searchParams }: { searchParams: { print?: string } }) {
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  return <LegalDocument doc={privacy} locale={locale} path="/privacy" autoPrint={searchParams.print === "1"} privacyEmail={await getPrivacyEmail()} />;
}
