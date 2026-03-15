import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { AuditAction, BoardRoleType } from "@prisma/client";

export async function GET() {
  const { error } = await requirePermission("canAssignBoardRoles");
  if (error) return error;

  const boardRoles = await prisma.boardRole.findMany({
    include: {
      patient: {
        include: { contactProfile: true },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  return NextResponse.json({ boardRoles });
}

export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canAssignBoardRoles");
  if (error) return error;

  const { patientId, role, fromEmail } = await req.json();

  if (!patientId || !role) {
    return NextResponse.json(
      { error: "patientId and role are required" },
      { status: 400 },
    );
  }

  // Validate role is a valid BoardRoleType
  if (!Object.values(BoardRoleType).includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Check if this patient already has this role (active)
  const existing = await prisma.boardRole.findFirst({
    where: { patientId, role, active: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "This patient already holds this role" },
      { status: 409 },
    );
  }

  // If a previous inactive record exists for this combo, reactivate it
  const inactive = await prisma.boardRole.findFirst({
    where: { patientId, role, active: false },
  });

  const boardRole = inactive
    ? await prisma.boardRole.update({
        where: { id: inactive.id },
        data: {
          active: true,
          fromEmail: fromEmail || null,
          assignedBy: admin!.email,
          assignedAt: new Date(),
        },
        include: { patient: { include: { contactProfile: true } } },
      })
    : await prisma.boardRole.create({
        data: {
          patientId,
          role,
          fromEmail: fromEmail || null,
          assignedBy: admin!.email,
        },
        include: { patient: { include: { contactProfile: true } } },
      });

  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.BOARD_ROLE_ASSIGNED,
      resourceType: "BoardRole",
      resourceId: boardRole.id,
      details: `Role ${role} assigned to patient ${patientId} by ${admin!.email}`,
    },
  });

  return NextResponse.json({ boardRole }, { status: 201 });
}
