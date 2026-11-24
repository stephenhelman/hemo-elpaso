import type { Metadata } from "next";
import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import { switchAccountHref } from "@/lib/auth0-switch";

export const metadata: Metadata = {
  title: "Access denied",
  robots: { index: false, follow: false },
};

const t = {
  en: {
    deniedTitle: "We need a verified email",
    deniedBody: "The account you chose didn't share a verified email address with us. Please try a different account, or contact us and we'll help.",
    errorTitle: "Sign-in problem",
    errorBody: "Something went wrong signing in, please try again.",
    switchAccount: "Sign in with a different account",
    home: "Back to homepage",
    contact: "Contact us",
  },
  es: {
    deniedTitle: "Necesitamos un correo verificado",
    deniedBody:
      "La cuenta que eligió no compartió con nosotros un correo verificado. Pruebe con otra cuenta, o contáctenos y le ayudamos.",
    errorTitle: "Problema al iniciar sesión",
    errorBody: "Algo salió mal al iniciar sesión, por favor inténtalo de nuevo.",
    switchAccount: "Iniciar sesión con otra cuenta",
    home: "Volver al inicio",
    contact: "Contáctanos",
  },
};

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  const c = t[locale];
  const isError = searchParams.reason === "error";
  const switchHref = switchAccountHref("/portal");

  return (
    <div className="min-h-[70vh] bg-neutral-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-5">
          <BrandMark tone="light" iconHeight={72} showText={false} />
        </div>
        <h1 className="font-display font-bold text-neutral-900 text-2xl mb-3">
          {isError ? c.errorTitle : c.deniedTitle}
        </h1>
        <p className="text-neutral-500 text-sm leading-relaxed mb-6">
          {isError ? c.errorBody : c.deniedBody}
        </p>
        <div className="flex flex-col gap-3">
          {/* Plain <a>: this is an API route, not a client-side navigation */}
          <a
            href={switchHref}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            {c.switchAccount}
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
          >
            {c.contact}
          </Link>
          <Link
            href="/"
            className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            {c.home}
          </Link>
        </div>
      </div>
    </div>
  );
}
