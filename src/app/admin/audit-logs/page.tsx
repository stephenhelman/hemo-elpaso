import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { Lang } from "@/types";
import { getLocaleCookie } from "@/lib/locale";
import AuditLogsClient from "@/components/admin/AuditLogsClient";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: {
    page?: string;
    action?: string;
    patientSearch?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canViewAuditLogs")) redirect("/admin/dashboard");

  const locale = (await getLocaleCookie()) as Lang;

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const actionFilter = searchParams.action as AuditAction | undefined;
  const patientSearch = searchParams.patientSearch?.trim() || undefined;
  const dateFrom = searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined;
  const dateTo = searchParams.dateTo
    ? new Date(new Date(searchParams.dateTo).setHours(23, 59, 59, 999))
    : undefined;

  // Build where clause
  const where: any = {};
  if (actionFilter) where.action = actionFilter;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }
  if (patientSearch) {
    where.patient = {
      OR: [
        { email: { contains: patientSearch, mode: "insensitive" } },
        {
          contactProfile: {
            OR: [
              { firstName: { contains: patientSearch, mode: "insensitive" } },
              { lastName: { contains: patientSearch, mode: "insensitive" } },
            ],
          },
        },
      ],
    };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        patient: {
          select: {
            email: true,
            contactProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const allActions = Object.values(AuditAction);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AuditLogsClient
      logs={logs as any}
      total={total}
      totalPages={totalPages}
      currentPage={page}
      allActions={allActions}
      locale={locale}
      currentFilters={{
        action: searchParams.action,
        patientSearch: searchParams.patientSearch,
        dateFrom: searchParams.dateFrom,
        dateTo: searchParams.dateTo,
      }}
    />
  );
}
