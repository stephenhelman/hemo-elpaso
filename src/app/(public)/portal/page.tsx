import type { Metadata } from "next";
import Link from "next/link";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";

export const metadata: Metadata = { title: "My household", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Placeholder until the family page ships (feat/family-portal). middleware.ts already requires a linked household. */
export default async function PortalPage() {
  const es = ((await getLocaleCookie()) as Lang) === "es";
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="font-display font-bold text-neutral-900 text-2xl mb-3">{es ? "Su página familiar llegará pronto" : "Your family page is coming soon"}</h1>
        <p className="text-neutral-600 text-sm mb-6">{es ? "Ya iniciamos su sesión. Todavía estamos terminando esta página." : "You're signed in. We're still finishing this page."}</p>
        <Link href="/" className="text-sm text-primary font-semibold">{es ? "Volver al inicio" : "Back to homepage"}</Link>
      </div>
    </div>
  );
}
