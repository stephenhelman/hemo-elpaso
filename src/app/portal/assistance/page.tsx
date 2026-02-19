import { redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { Plus } from "lucide-react";
import Link from "next/link";
import ApplicationsList from "@/components/portal/assistance/ApplicationsList";

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
      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              Financial Assistance
            </h1>
            <p className="text-neutral-600">
              Apply for and track financial assistance applications
            </p>
          </div>

          <Link
            href="/portal/assistance/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Application
          </Link>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-blue-900 mb-2">
            How Financial Assistance Works
          </h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Submit an application for event fees, transportation,
              medication, or other needs
            </li>
            <li>
              • Upload supporting documents (receipts, bills, prescriptions)
            </li>
            <li>
              • HOEP staff will review your application within 5-7 business days
            </li>
            <li>• If approved, you'll receive a check or reimbursement</li>
            <li>• Track your application status here</li>
          </ul>
        </div>

        {/* Applications List */}
        <ApplicationsList applications={applications} />
      </div>
    </div>
  );
}
