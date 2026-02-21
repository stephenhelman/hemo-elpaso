import { redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { FileText, AlertCircle } from "lucide-react";
import DiagnosisVerificationList from "@/components/admin/DiagnosisVerificationList";
import { StatCard } from "@/components/ui/StatCard";

export default async function DiagnosisVerificationPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

  // Fetch patients with pending diagnosis letters (patient)
  const patientsWithPendingDiagnosis = await prisma.patient.findMany({
    where: {
      diagnosisLetterUrl: { not: null },
      diagnosisVerified: false,
      profile: {
        primaryCondition: { not: undefined },
      },
    },
    include: {
      profile: true,
    },
    orderBy: {
      diagnosisLetterUploadedAt: "desc",
    },
  });

  // Fetch family members with pending diagnosis letters
  const familyMembersWithPendingDiagnosis = await prisma.familyMember.findMany({
    where: {
      diagnosisLetterUrl: { not: null },
      diagnosisVerified: false,
      hasBleedingDisorder: true,
    },
    include: {
      patient: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: {
      diagnosisLetterUploadedAt: "desc",
    },
  });

  // Calculate stats
  const totalPending =
    patientsWithPendingDiagnosis.length +
    familyMembersWithPendingDiagnosis.length;

  const expiringSoon = await prisma.patient.count({
    where: {
      diagnosisVerified: false,
      diagnosisLetterUrl: null,
      diagnosisGracePeriodEndsAt: {
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        gte: new Date(),
      },
    },
  });

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
          Diagnosis Letter Verification
        </h1>
        <p className="text-neutral-600">
          Review and verify patient diagnosis letters
        </p>
      </div>

      {/* Verification List */}
      <DiagnosisVerificationList
        patients={patientsWithPendingDiagnosis}
        familyMembers={familyMembersWithPendingDiagnosis}
        adminEmail={admin.email}
      >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            icon={<FileText className="w-6 h-6" />}
            label="Pending Verification"
            value={totalPending.toString()}
            color="blue"
          />
          <StatCard
            icon={<AlertCircle className="w-6 h-6" />}
            label="Grace Period Expiring Soon"
            value={expiringSoon.toString()}
            color="amber"
          />
        </div>
      </DiagnosisVerificationList>
    </div>
  );
}
