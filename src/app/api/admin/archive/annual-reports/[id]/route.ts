import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

interface Props {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: { boardRoles: true },
  });

  const isTreasurer =
    admin?.boardRoles.some((r) => r.role === "TREASURER" && r.active) ||
    admin?.role === "admin";

  if (!admin || !isTreasurer) {
    return NextResponse.json(
      { error: "Only the Treasurer can update annual reports" },
      { status: 403 },
    );
  }

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
      patientId: admin.id,
      action: AuditAction.ANNUAL_REPORT_UPDATED,
      resourceType: "AnnualReport",
      resourceId: params.id,
      details: `Annual report updated for ${report.year}`,
    },
  });

  return NextResponse.json({ report });
}
