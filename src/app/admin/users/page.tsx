import { redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { Users, Search, Filter, Download } from "lucide-react";
import UsersTable from "@/components/admin/users/UsersTable";

interface Props {
  searchParams: {
    search?: string;
    role?: string;
    condition?: string;
  };
}

export default async function AdminUsersPage({ searchParams }: Props) {
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

  if (searchParams.role && searchParams.role !== "all") {
    where.role = searchParams.role;
  }

  if (searchParams.condition && searchParams.condition !== "all") {
    where.profile = {
      primaryCondition: searchParams.condition,
    };
  }

  // Fetch users
  const users = await prisma.patient.findMany({
    where,
    include: {
      profile: true,
      _count: {
        select: {
          rsvps: true,
          checkIns: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get unique conditions for filter
  const allProfiles = await prisma.patientProfile.findMany({
    select: {
      primaryCondition: true,
    },
    distinct: ["primaryCondition"],
  });

  const conditions = allProfiles
    .map((p) => p.primaryCondition)
    .filter(Boolean)
    .sort();

  // Stats
  const totalUsers = users.length;
  const patientCount = users.filter((u) => u.role === "patient").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const boardCount = users.filter((u) => u.role === "board").length;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              User Management
            </h1>
            <p className="text-neutral-600">
              Manage all registered users, roles, and view participation history
            </p>
          </div>
          <a
            href="/api/admin/users/export"
            download
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Total Users"
            value={totalUsers.toString()}
            color="blue"
          />
          <StatCard
            label="Patients"
            value={patientCount.toString()}
            color="green"
          />
          <StatCard
            label="Admins"
            value={adminCount.toString()}
            color="purple"
          />
          <StatCard
            label="Board Members"
            value={boardCount.toString()}
            color="amber"
          />
        </div>

        {/* Users Table */}
        <UsersTable
          users={users}
          conditions={conditions}
          currentSearch={searchParams.search}
          currentRole={searchParams.role}
          currentCondition={searchParams.condition}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    amber: "bg-amber-100 text-amber-600",
  }[color];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div
        className={`w-12 h-12 rounded-xl ${colorClasses} flex items-center justify-center mb-4`}
      >
        <Users className="w-6 h-6" />
      </div>
      <p className="text-2xl font-display font-bold text-neutral-900">
        {value}
      </p>
      <p className="text-sm text-neutral-600">{label}</p>
    </div>
  );
}
