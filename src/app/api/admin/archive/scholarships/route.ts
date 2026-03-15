import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function GET() {
  const scholarships = await prisma.scholarship.findMany({
    orderBy: [{ awardedAt: "desc" }],
  });
  return NextResponse.json({ scholarships });
}

export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageFinancials");
  if (error) return error;

  const { recipientName, amount, academicYear, description, awardedAt } =
    await req.json();

  if (
    !recipientName?.trim() ||
    !amount ||
    !academicYear?.trim() ||
    !awardedAt
  ) {
    return NextResponse.json(
      {
        error:
          "recipientName, amount, academicYear, and awardedAt are required",
      },
      { status: 400 },
    );
  }

  const scholarship = await prisma.scholarship.create({
    data: {
      recipientName,
      amount,
      academicYear,
      description,
      awardedAt: new Date(awardedAt),
      createdBy: admin!.email,
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.SCHOLARSHIP_CREATED,
      resourceType: "Scholarship",
      resourceId: scholarship.id,
      details: `Scholarship created for ${recipientName} — ${academicYear}`,
    },
  });

  return NextResponse.json({ scholarship }, { status: 201 });
}
