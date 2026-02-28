import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import EditApplicationForm from "@/components/portal/assistance/EditApplicationForm";
import { Lang } from "@/types";
import { assistanceEditPageTranslation } from "@/translation/portalAssistance";
import { getLocaleCookie } from "@/lib/locale";

interface Props {
  params: { id: string };
}

export default async function EditApplicationPage({ params }: Props) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!patient) {
    redirect("/api/auth/login");
  }

  const application = await prisma.financialAssistanceApplication.findUnique({
    where: { id: params.id },
    include: {
      documents: true,
    },
  });

  if (!application || application.patientId !== patient.id) {
    notFound();
  }

  // Only allow editing drafts or submitted applications (not under review, approved, etc)
  const canEdit = ["DRAFT", "SUBMITTED"].includes(application.status);

  if (!canEdit) {
    redirect(`/portal/assistance/${application.id}`);
  }

  const locale = (await getLocaleCookie()) as Lang;
  const t = assistanceEditPageTranslation[locale as Lang];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href={`/portal/assistance/${application.id}`}
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

        <EditApplicationForm application={application} locale={locale} />
      </div>
    </div>
  );
}
