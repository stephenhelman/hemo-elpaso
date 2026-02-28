import { redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ApplicationForm from "@/components/portal/assistance/ApplicationForm";
import { Lang } from "@/types";
import { assistanceNewPageTranslation } from "@/translation/portalAssistance";
import { getLocaleCookie } from "@/lib/locale";

export default async function NewApplicationPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: {
      contactProfile: true,
    },
  });

  if (!patient) {
    redirect("/api/auth/login");
  }

  const locale = (await getLocaleCookie()) as Lang;
  const t = assistanceNewPageTranslation[locale];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/portal/assistance"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            {t.heading}
          </h1>
          <p className="text-neutral-600">{t.subtitle}</p>
        </div>

        <ApplicationForm patient={patient} locale={locale} />
      </div>
    </div>
  );
}
