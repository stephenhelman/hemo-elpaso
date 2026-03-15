import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { StatCard } from "@/components/ui/StatCard";
import { DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react";
import ApplicationsTable from "@/components/admin/assistance/ApplicationsTable";
import { adminAssistancePageTranslation } from "@/translation/adminAssistance";
import { getLocaleCookie } from "@/lib/locale";
import { Lang } from "@/types";

interface Props {
  searchParams: {
    status?: string;
    type?: string;
  };
}

export default async function AdminAssistancePage({ searchParams }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canApproveAssistance")) redirect("/admin/dashboard");

  const locale = (await getLocaleCookie()) as Lang;
  const t = adminAssistancePageTranslation[locale];

  // Build filter
  const where: any = {};

  if (searchParams.status && searchParams.status !== "all") {
    where.status = searchParams.status;
  }

  if (searchParams.type && searchParams.type !== "all") {
    where.assistanceType = searchParams.type;
  }

  // Fetch applications
  const applications = await prisma.financialAssistanceApplication.findMany({
    where,
    include: {
      patient: true,
      documents: true,
      disbursements: true,
      _count: {
        select: {
          documents: true,
          disbursements: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate stats
  const totalApplications = applications.length;
  const pendingReview = applications.filter((a) =>
    ["SUBMITTED", "UNDER_REVIEW"].includes(a.status),
  ).length;
  const approved = applications.filter((a) => a.status === "APPROVED").length;
  const totalRequested = applications.reduce(
    (sum, a) => sum + Number(a.requestedAmount),
    0,
  );
  const totalApproved = applications
    .filter((a) => a.approvedAmount)
    .reduce((sum, a) => sum + Number(a.approvedAmount || 0), 0);

  const applicationsFormatted = applications.map((app) => ({
    ...app,
    requestedAmount: Number(app.requestedAmount),
    approvedAmount: app.approvedAmount ? Number(app.approvedAmount) : null,
    disbursements: app.disbursements.map((d) => ({
      ...d,
      amount: Number(d.amount),
    })),
  }));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
          {t.heading}
        </h1>
        <p className="text-neutral-600">{t.subtitle}</p>
      </div>

      {/* Applications Table */}
      <ApplicationsTable
        applications={applicationsFormatted}
        currentStatus={searchParams.status}
        currentType={searchParams.type}
        locale={locale}
      >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label={t.totalApplications}
            value={totalApplications.toString()}
            color="blue"
          />
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            label={t.pendingReview}
            value={pendingReview.toString()}
            color="yellow"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label={t.approved}
            value={approved.toString()}
            color="green"
          />
          <StatCard
            icon={<AlertCircle className="w-6 h-6" />}
            label={t.requestedApproved}
            value={`$${totalRequested.toFixed(0)} / $${totalApproved.toFixed(0)}`}
            color="purple"
          />
        </div>
      </ApplicationsTable>
    </div>
  );
}
