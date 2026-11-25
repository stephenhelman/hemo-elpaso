import type { Metadata } from "next";
import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import { getLocaleCookie } from "@/lib/locale";
import { switchAccountHref } from "@/lib/auth0-switch";
import type { Lang } from "@/types";

export const metadata: Metadata = {
  title: "We couldn't find your household",
  robots: { index: false, follow: false },
};

// No names, emails or household details on this page: it only says the sign-in matched nothing.
const t = {
  en: {
    title: "We couldn't find your household",
    body: "You signed in, but the email on that account doesn't match a household we have. If you haven't registered yet, you can do that now. If you have, you may have signed in with a different email, with Apple's “Hide my email”, or by asking for a code at a different address. A code sent to the email you registered with always works. Tell us and we'll connect it for you.",
    register: "Register your household",
    contact: "Contact HOEP",
    switchAccount: "Sign in with a different account",
    home: "Back to homepage",
  },
  es: {
    title: "No encontramos su hogar",
    body: "Inició sesión, pero el correo de esa cuenta no coincide con ningún hogar que tengamos. Si aún no se ha registrado, puede hacerlo ahora. Si ya lo hizo, tal vez inició sesión con otro correo, con “Ocultar mi correo” de Apple, o pidió un código a otra dirección. Un código enviado al correo con el que se registró siempre funciona. Avísenos y lo conectamos.",
    register: "Registre su hogar",
    contact: "Contactar a HOEP",
    switchAccount: "Iniciar sesión con otra cuenta",
    home: "Volver al inicio",
  },
};

export default async function NoHouseholdPage() {
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  const c = t[locale];
  return (
    <div className="min-h-[70vh] bg-neutral-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-5">
          <BrandMark tone="light" iconHeight={72} showText={false} />
        </div>
        <h1 className="font-display font-bold text-neutral-900 text-2xl mb-3">{c.title}</h1>
        <p className="text-neutral-500 text-sm leading-relaxed mb-6">{c.body}</p>
        <div className="flex flex-col gap-3">
          <Link href="/register-info" className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors">{c.register}</Link>
          <Link href="/contact" className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors">{c.contact}</Link>
          {/* Plain <a>: this is an API route, not a client-side navigation */}
          <a href={switchAccountHref("/portal")} className="text-sm text-neutral-600 hover:text-neutral-800 transition-colors">{c.switchAccount}</a>
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors">{c.home}</Link>
        </div>
      </div>
    </div>
  );
}
