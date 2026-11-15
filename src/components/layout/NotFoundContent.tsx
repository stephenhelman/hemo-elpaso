import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import type { Lang } from "@/types";
import { pick, type Localized } from "@/sanity/helpers/pick";

const t = {
  en: {
    title: "Page not found",
    body: "We couldn't find that page. It may have moved, or the link may be mistyped.",
    home: "Back to homepage",
    events: "See events",
    contact: "Contact us",
    callUs: "Questions? Call us at",
  },
  es: {
    title: "Página no encontrada",
    body: "No pudimos encontrar esa página. Puede que se haya movido o que el enlace tenga un error.",
    home: "Volver al inicio",
    events: "Ver eventos",
    contact: "Contáctenos",
    callUs: "¿Preguntas? Llámenos al",
  },
};

/** Shared 404 body (server component). Settings come from Sanity with a code fallback. */
export default function NotFoundContent({
  locale,
  orgName,
  tagline,
  phone,
}: {
  locale: Lang;
  orgName: string;
  tagline?: Localized;
  phone: { display: string; e164: string };
}) {
  const c = t[locale === "es" ? "es" : "en"];
  const tag = pick(tagline, locale === "es" ? "es" : "en");
  return (
    <div className="min-h-[70vh] bg-neutral-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-5">
          <BrandMark tone="light" iconHeight={72} showText={false} />
        </div>
        <p className="text-primary font-semibold text-sm uppercase tracking-wide mb-2">404</p>
        <h1 className="font-display font-bold text-neutral-900 text-2xl mb-3">{c.title}</h1>
        <p className="text-neutral-500 text-sm leading-relaxed mb-6">{c.body}</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            {c.home}
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
          >
            {c.events}
          </Link>
          <Link href="/contact" className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
            {c.contact}
          </Link>
        </div>
        <p className="text-xs text-neutral-400 mt-8">
          {orgName}
          {tag ? ` · ${tag}` : ""}
          <br />
          {c.callUs}{" "}
          <a href={`tel:${phone.e164}`} className="hover:text-primary">
            {phone.display}
          </a>
        </p>
      </div>
    </div>
  );
}
