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

  const scholarship = await prisma.scholarship.update({
    where: { id: params.id },
    data: {
      ...(body.recipientName && { recipientName: body.recipientName }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.academicYear && { academicYear: body.academicYear }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.awardedAt && { awardedAt: new Date(body.awardedAt) }),
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.SCHOLARSHIP_UPDATED,
      resourceType: "Scholarship",
      resourceId: params.id,
      details: `Scholarship updated for ${scholarship.recipientName}`,
    },
  });

  return NextResponse.json({ scholarship });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const { admin, error } = await requirePermission("canManageFinancials");
  if (error) return error;

  const scholarship = await prisma.scholarship.findUnique({
    where: { id: params.id },
  });

  if (!scholarship) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.scholarship.delete({ where: { id: params.id } });

  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.SCHOLARSHIP_DELETED,
      resourceType: "Scholarship",
      resourceId: params.id,
      details: `Scholarship deleted for ${scholarship.recipientName}`,
    },
  });

  return NextResponse.json({ success: true });
}
