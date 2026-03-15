import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { FileText, AlertCircle } from "lucide-react";
import DiagnosisVerificationList from "@/components/admin/DiagnosisVerificationList";
import { StatCard } from "@/components/ui/StatCard";
import { Lang } from "@/types";
import { adminVerificationTranslation } from "@/translation/adminPages";
import { getLocaleCookie } from "@/lib/locale";

export default async function DiagnosisVerificationPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canViewPHI")) redirect("/admin/dashboard");

  const locale = (await getLocaleCookie()) as Lang;
  const t = adminVerificationTranslation[locale as Lang];

  // Fetch patients with pending diagnosis letters (patient)
  const patientsWithPendingDiagnosis = await prisma.patient.findMany({
    where: {
      disorderProfile: {
        diagnosisLetterUrl: { not: null },
        diagnosisVerified: false,
        condition: { not: "" },
      },
    },
    include: {
      contactProfile: true,
      disorderProfile: true,
    },
    orderBy: {
      disorderProfile: { diagnosisLetterUploadedAt: "desc" },
    },
  });

  // Fetch family members with pending diagnosis letters
  const familyMembersWithPendingDiagnosis = await prisma.familyMember.findMany({
    where: {
      hasBleedingDisorder: true,
      disorderProfile: {
        diagnosisLetterUrl: { not: null },
        diagnosisVerified: false,
      },
    },
    include: {
      contactProfile: true,
      patient: {
        include: {
          contactProfile: true,
        },
      },
    },
    orderBy: {
      disorderProfile: { diagnosisLetterUploadedAt: "desc" },
    },
  });

  // Calculate stats
  const totalPending =
    patientsWithPendingDiagnosis.length +
    familyMembersWithPendingDiagnosis.length;

  const expiringSoon = await prisma.patient.count({
    where: {
      disorderProfile: {
        diagnosisVerified: false,
        diagnosisLetterUrl: null,
      },
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
          {t.heading}
        </h1>
        <p className="text-neutral-600">{t.subtitle}</p>
      </div>

      {/* Verification List */}
      <DiagnosisVerificationList
        patients={patientsWithPendingDiagnosis}
        familyMembers={familyMembersWithPendingDiagnosis}
        adminEmail={admin!.email}
      >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            icon={<FileText className="w-6 h-6" />}
            label={t.pendingVerification}
            value={totalPending.toString()}
            color="blue"
          />
          <StatCard
            icon={<AlertCircle className="w-6 h-6" />}
            label={t.expiringGracePeriod}
            value={expiringSoon.toString()}
            color="amber"
          />
        </div>
      </DiagnosisVerificationList>
    </div>
  );
}
