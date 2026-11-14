import Link from "next/link";
import { CheckCircle, AlertCircle } from "lucide-react";
import { contactEmail } from "@/lib/site";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";

// Locale comes from a cookie, so render per request.
export const dynamic = "force-dynamic";

const t = {
  en: {
    doneTitle: "You've been unsubscribed",
    doneBody:
      "You will no longer receive HOEP event invitations at this email address. If you RSVP to an event you'll still get its confirmation and reminder. To start receiving invitations again, just contact us.",
    contact: "Contact Us",
    home: "Return to homepage",
    failTitle: "Unsubscribe failed",
    invalid:
      "This unsubscribe link is invalid or has expired. Please use the link from a recent email from HOEP.",
    generic: (email: string) =>
      `Something went wrong. Please contact us at ${email} to be removed from our mailing list.`,
  },
  es: {
    doneTitle: "Se canceló tu suscripción",
    doneBody:
      "Ya no recibirás invitaciones a eventos de HOEP en este correo electrónico. Si confirmas tu asistencia a un evento, seguirás recibiendo su confirmación y recordatorio. Para volver a recibir invitaciones, solo contáctanos.",
    contact: "Contáctanos",
    home: "Volver al inicio",
    failTitle: "No se pudo cancelar la suscripción",
    invalid:
      "Este enlace para cancelar la suscripción no es válido o ya expiró. Usa el enlace de un correo reciente de HOEP.",
    generic: (email: string) =>
      `Algo salió mal. Escríbenos a ${email} para que te quitemos de nuestra lista de correo.`,
  },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
  const locale: Lang = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  const c = t[locale];
  const success = searchParams.success === "1";
  const error = searchParams.error;

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="font-display font-bold text-neutral-900 text-2xl mb-3">
            {c.doneTitle}
          </h1>
          <p className="text-neutral-500 text-sm leading-relaxed mb-6">{c.doneBody}</p>
          <div className="flex flex-col gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
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

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="font-display font-bold text-neutral-900 text-2xl mb-3">
          {c.failTitle}
        </h1>
        <p className="text-neutral-500 text-sm leading-relaxed mb-6">
          {error === "invalid" || error === "missing" ? c.invalid : c.generic(contactEmail())}
        </p>
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          {c.home}
        </Link>
      </div>
    </div>
  );
}
