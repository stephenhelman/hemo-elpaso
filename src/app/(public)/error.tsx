"use client";

import { useEffect } from "react";
import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteInfo } from "@/context/SiteSettingsContext";

const t = {
  en: {
    title: "Something went wrong",
    body: "We hit an unexpected problem loading this page. Please try again.",
    retry: "Try again",
    home: "Back to homepage",
    callUs: "If it keeps happening, call us at",
  },
  es: {
    title: "Algo salió mal",
    body: "Tuvimos un problema inesperado al cargar esta página. Por favor, inténtelo de nuevo.",
    retry: "Intentar de nuevo",
    home: "Volver al inicio",
    callUs: "Si sigue ocurriendo, llámenos al",
  },
};

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale } = useLanguage();
  const site = useSiteInfo();
  const c = t[locale === "es" ? "es" : "en"];

  useEffect(() => {
    // digest only: the message can contain request details
    console.error("public page error", error.digest ?? "");
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-neutral-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-5">
          <BrandMark tone="light" iconHeight={72} showText={false} />
        </div>
        <h1 className="font-display font-bold text-neutral-900 text-2xl mb-3">{c.title}</h1>
        <p className="text-neutral-500 text-sm leading-relaxed mb-6">{c.body}</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            {c.retry}
          </button>
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
            {c.home}
          </Link>
        </div>
        <p className="text-xs text-neutral-400 mt-8">
          {site.orgName}
          <br />
          {c.callUs}{" "}
          <a href={`tel:${site.phone.e164}`} className="hover:text-primary">
            {site.phone.display}
          </a>
        </p>
      </div>
    </div>
  );
}
