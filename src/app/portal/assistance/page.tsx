import { redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { Plus } from "lucide-react";
import Link from "next/link";
import ApplicationsList from "@/components/portal/assistance/ApplicationsList";
import { Lang } from "@/types";
import { assistancePageTranslation } from "@/translation/portalAssistance";

export default async function FinancialAssistancePage() {
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

  const locale = ((await cookies()).get("locale")?.value as Lang) || "en";
  const t = assistancePageTranslation[locale];

  // Fetch patient's applications
  const applications = await prisma.financialAssistanceApplication.findMany({
    where: { patientId: patient.id },
    include: {
      documents: true,
      disbursements: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              {t.heading}
            </h1>
            <p className="text-neutral-600">{t.subtitle}</p>
          </div>

          <Link
            href="/portal/assistance/new"
            className="flex items-center justify-center gap-2 px-4 py-2 w-full md:w-auto rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t.newApplication}
          </Link>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-blue-900 mb-2">
            {t.howItWorksHeading}
          </h2>
          <ul className="text-sm text-blue-800 space-y-1">
            {t.steps.map((step, i) => (
              <li key={i}>• {step}</li>
            ))}
          </ul>
        </div>

        {/* Applications List */}
        <ApplicationsList applications={applications} locale={locale} />
      </div>
    </div>
  );
}
