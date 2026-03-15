import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

// Auto-calculate values for a given year from DB
async function calculateYearStats(year: number) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const [events, assistanceDisbursements, scholarships] = await Promise.all([
    // Events held (completed or published)
    prisma.event.findMany({
      where: {
        eventDate: { gte: startDate, lte: endDate },
        status: { in: ["completed", "published"] },
      },
      include: { checkIns: true },
    }),

    // Total assistance disbursed
    prisma.assistanceDisbursement.findMany({
      where: {
        issueDate: { gte: startDate, lte: endDate },
        status: { in: ["ISSUED", "CASHED"] },
      },
    }),

    // Total scholarships awarded
    prisma.scholarship.findMany({
      where: {
        awardedAt: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  const totalEventsHeld = events.length;
  const totalAttendance = events.reduce((sum, e) => sum + e.checkIns.length, 0);
  const totalAssistancePaid = assistanceDisbursements.reduce(
    (sum, d) => sum + Number(d.amount),
    0,
  );
  const totalScholarshipsPaid = scholarships.reduce(
    (sum, s) => sum + Number(s.amount),
    0,
  );

  return {
    totalEventsHeld,
    totalAttendance,
    totalAssistancePaid,
    totalScholarshipsPaid,
  };
}

export async function GET() {
  const reports = await prisma.annualReport.findMany({
    orderBy: { year: "desc" },
  });
  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
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
      { error: "Only the Treasurer can manage annual reports" },
      { status: 403 },
    );
  }

  const { year, totalSponsorIncome, notes, overrides } = await req.json();

  if (!year) {
    return NextResponse.json({ error: "year is required" }, { status: 400 });
  }

  // Check for existing report
  const existing = await prisma.annualReport.findUnique({
    where: { year },
  });

  if (existing) {
    return NextResponse.json(
      {
        error: `Annual report for ${year} already exists`,
        reportId: existing.id,
      },
      { status: 409 },
    );
  }

  // Auto-calculate from DB
  const calculated = await calculateYearStats(year);

  // Merge with any Treasurer overrides
  const report = await prisma.annualReport.create({
    data: {
      year,
      totalEventsHeld: overrides?.totalEventsHeld ?? calculated.totalEventsHeld,
      totalAttendance: overrides?.totalAttendance ?? calculated.totalAttendance,
      totalAssistancePaid:
        overrides?.totalAssistancePaid ?? calculated.totalAssistancePaid,
      totalScholarshipsPaid:
        overrides?.totalScholarshipsPaid ?? calculated.totalScholarshipsPaid,
      totalSponsorIncome: totalSponsorIncome ?? null,
      notes: notes ?? null,
      createdBy: admin.email,
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: admin.id,
      action: AuditAction.ANNUAL_REPORT_CREATED,
      resourceType: "AnnualReport",
      resourceId: report.id,
      details: `Annual report created for ${year}`,
    },
  });

  return NextResponse.json({ report, calculated }, { status: 201 });
}
