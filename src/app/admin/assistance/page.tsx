import { redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import ApplicationsTable from "@/components/admin/assistance/ApplicationsTable";

interface Props {
  searchParams: {
    status?: string;
    type?: string;
  };
}

export default async function AdminAssistancePage({ searchParams }: Props) {
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
      patient: {
        include: {
          profile: true,
        },
      },
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
          Financial Assistance Applications
        </h1>
        <p className="text-neutral-600">
          Review and manage financial assistance requests from patients
        </p>
      </div>

      {/* Applications Table */}
      <ApplicationsTable
        applications={applicationsFormatted}
        currentStatus={searchParams.status}
        currentType={searchParams.type}
      >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Total Applications"
            value={totalApplications.toString()}
            color="blue"
          />
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            label="Pending Review"
            value={pendingReview.toString()}
            color="yellow"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Approved"
            value={approved.toString()}
            color="green"
          />
          <StatCard
            icon={<AlertCircle className="w-6 h-6" />}
            label="Requested / Approved"
            value={`$${totalRequested.toFixed(0)} / $${totalApproved.toFixed(0)}`}
            color="purple"
          />
        </div>
      </ApplicationsTable>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
  }[color];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div
        className={`w-12 h-12 rounded-xl ${colorClasses} flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <p className="text-2xl font-display font-bold text-neutral-900">
        {value}
      </p>
      <p className="text-sm text-neutral-600">{label}</p>
    </div>
  );
}
