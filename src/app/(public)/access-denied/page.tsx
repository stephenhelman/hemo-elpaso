import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
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

// Log out first so Auth0 drops any session, then go straight back to login.
const SWITCH_ACCOUNT_HREF = `/api/auth/logout?returnTo=${encodeURIComponent(
  `/api/auth/login?returnTo=${encodeURIComponent("/admin")}`,
)}`;

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  const c = t[locale];
  const isError = searchParams.reason === "error";

  return (
    <div className="min-h-[70vh] bg-neutral-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-8 h-8 text-primary" />
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
            href={SWITCH_ACCOUNT_HREF}
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
