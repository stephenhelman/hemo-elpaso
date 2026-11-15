import type { Metadata } from "next";
import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";

export const metadata: Metadata = {
  title: "Access denied",
  robots: { index: false, follow: false },
};

const t = {
  en: {
    deniedTitle: "Board members only",
    deniedBody: "This login is for HOEP board members only.",
    errorTitle: "Sign-in problem",
    errorBody: "Something went wrong signing in, please try again.",
    switchAccount: "Sign in with a different account",
    home: "Back to homepage",
    contact: "Contact us",
  },
  es: {
    deniedTitle: "Solo para miembros de la junta",
    deniedBody:
      "Este acceso es solo para miembros de la junta directiva de HOEP.",
    errorTitle: "Problema al iniciar sesión",
    errorBody: "Algo salió mal al iniciar sesión, por favor inténtalo de nuevo.",
    switchAccount: "Iniciar sesión con otra cuenta",
    home: "Volver al inicio",
    contact: "Contáctanos",
  },
};

/**
 * A denied user has NO app session, so /api/auth/logout would skip the Auth0
 * logout and the Auth0 SSO + Google sessions would survive (and "login" would
 * silently sign them straight back into the same denied account). So go to
 * Auth0's own /v2/logout directly, then return to /api/auth/login with
 * prompt=login so Auth0 re-authenticates. Built server-side from env vars.
 * The returnTo URL below must be listed in Auth0 "Allowed Logout URLs".
 */
function switchAccountHref(): string {
  const issuer = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const base = process.env.AUTH0_BASE_URL;
  if (!issuer || !clientId || !base) return "/api/auth/logout"; // best effort if env is incomplete
  const host = new URL(issuer).host;
  const returnTo = `${base.replace(/\/$/, "")}/api/auth/login?returnTo=/admin&prompt=login`;
  return `https://${host}/v2/logout?client_id=${encodeURIComponent(clientId)}&returnTo=${encodeURIComponent(returnTo)}`;
}

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  const c = t[locale];
  const isError = searchParams.reason === "error";
  const switchHref = switchAccountHref();

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
