import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { Users } from "lucide-react";
import UsersTable from "@/components/admin/users/UsersTable";
import { StatCard } from "@/components/ui/StatCard";
import { Lang } from "@/types";
import { adminUsersTranslation } from "@/translation/adminPages";
import { getLocaleCookie } from "@/lib/locale";

interface Props {
  searchParams: {
    search?: string;
    role?: string;
    condition?: string;
  };
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canManageUsers")) redirect("/admin/dashboard");

  const locale = (await getLocaleCookie()) as Lang;
  const t = adminUsersTranslation[locale as Lang];

  // Build filter
  const where: any = {};

  if (searchParams.role && searchParams.role !== "all") {
    where.role = searchParams.role;
  }

  if (searchParams.condition && searchParams.condition !== "all") {
    where.disorderProfile = {
      condition: searchParams.condition,
    };
  }

  // Fetch users
  const users = await prisma.patient.findMany({
    where,
    include: {
      contactProfile: true,
      disorderProfile: true,
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
  const allDisorderProfiles = await prisma.disorderProfile.findMany({
    select: {
      condition: true,
    },
    distinct: ["condition"],
  });

  const conditions = allDisorderProfiles
    .map((p) => p.condition)
    .filter(Boolean)
    .sort();

  // Stats
  const totalUsers = users.length;
  const patientCount = users.filter((u) => u.role === "patient").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const boardCount = users.filter((u) => u.role === "board").length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            {t.heading}
          </h1>
          <p className="text-neutral-600">{t.subtitle}</p>
        </div>
      </div>

      {/* Users Table */}
      <UsersTable
        users={users}
        conditions={conditions}
        currentSearch={searchParams.search}
        currentRole={searchParams.role}
        currentCondition={searchParams.condition}
        locale={locale}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            label={t.totalUsers}
            value={totalUsers.toString()}
            color="blue"
            icon={<Users className="w-6 h-6" />}
          />
          <StatCard
            label={t.patients}
            value={patientCount.toString()}
            color="green"
            icon={<Users className="w-6 h-6" />}
          />
          <StatCard
            label={t.admins}
            value={adminCount.toString()}
            color="purple"
            icon={<Users className="w-6 h-6" />}
          />
          <StatCard
            label={t.boardMembers}
            value={boardCount.toString()}
            color="amber"
            icon={<Users className="w-6 h-6" />}
          />
        </div>
      </UsersTable>
    </div>
  );
}
