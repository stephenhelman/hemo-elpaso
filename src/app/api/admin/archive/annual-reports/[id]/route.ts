import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

interface Props {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { admin, error } = await requirePermission("canManageFinancials");
  if (error) return error;

  const body = await req.json();

  const report = await prisma.annualReport.update({
    where: { id: params.id },
    data: {
      ...(body.totalEventsHeld !== undefined && {
        totalEventsHeld: body.totalEventsHeld,
      }),
      ...(body.totalAttendance !== undefined && {
        totalAttendance: body.totalAttendance,
      }),
      ...(body.totalAssistancePaid !== undefined && {
        totalAssistancePaid: body.totalAssistancePaid,
      }),
      ...(body.totalScholarshipsPaid !== undefined && {
        totalScholarshipsPaid: body.totalScholarshipsPaid,
      }),
      ...(body.totalSponsorIncome !== undefined && {
        totalSponsorIncome: body.totalSponsorIncome,
      }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.ANNUAL_REPORT_UPDATED,
      resourceType: "AnnualReport",
      resourceId: params.id,
      details: `Annual report updated for ${report.year}`,
    },
  });

  return NextResponse.json({ report });
}
