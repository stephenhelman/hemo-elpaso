import type { Metadata } from "next";
import { getLocaleCookie } from "@/lib/locale";
import { editText } from "@/lib/portal/edit-text";
import ConfirmEmailButton from "./ConfirmEmailButton";

export const metadata: Metadata = { title: "Confirm your new email", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

/**
 * The link in the "confirm your new email" message. The page only SHOWS a button (a link preview or scanner can't confirm
 * anything by loading it). Signed-in access is required by middleware, and the API only accepts the person who asked.
 */
export default async function ConfirmEmailPage({ params }: { params: { token: string } }) {
  const lang: "en" | "es" = (await getLocaleCookie()) === "es" ? "es" : "en";
  const t = editText[lang];
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center space-y-4">
        <h1 className="font-display font-bold text-neutral-900 text-2xl">{t.confirmEmailTitle}</h1>
        <p className="text-neutral-600 text-sm">{t.confirmEmailBody}</p>
        <ConfirmEmailButton token={params.token} lang={lang} />
      </div>
    </div>
  );
}
