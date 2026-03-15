import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function GET() {
  const scholarships = await prisma.scholarship.findMany({
    orderBy: [{ awardedAt: "desc" }],
  });
  return NextResponse.json({ scholarships });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
      createdBy: admin.email,
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: admin.id,
      action: AuditAction.SCHOLARSHIP_CREATED,
      resourceType: "Scholarship",
      resourceId: scholarship.id,
      details: `Scholarship created for ${recipientName} — ${academicYear}`,
    },
  });

  return NextResponse.json({ scholarship }, { status: 201 });
}
