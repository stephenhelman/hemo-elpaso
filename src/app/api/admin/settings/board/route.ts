import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction, BoardRoleType } from "@prisma/client";

export async function GET() {
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
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: { boardRoles: true },
  });

  // Only President, VP, or admin can assign roles
  const canAssign =
    admin?.role === "admin" ||
    admin?.boardRoles.some(
      (r) => r.active && ["PRESIDENT", "VICE_PRESIDENT"].includes(r.role),
    );

  if (!admin || !canAssign) {
    return NextResponse.json(
      { error: "Only the President or Vice President can assign board roles" },
      { status: 403 },
    );
  }

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
          assignedBy: admin.email,
          assignedAt: new Date(),
        },
        include: { patient: { include: { contactProfile: true } } },
      })
    : await prisma.boardRole.create({
        data: {
          patientId,
          role,
          fromEmail: fromEmail || null,
          assignedBy: admin.email,
        },
        include: { patient: { include: { contactProfile: true } } },
      });

  await prisma.auditLog.create({
    data: {
      patientId: admin.id,
      action: AuditAction.BOARD_ROLE_ASSIGNED,
      resourceType: "BoardRole",
      resourceId: boardRole.id,
      details: `Role ${role} assigned to patient ${patientId} by ${admin.email}`,
    },
  });

  return NextResponse.json({ boardRole }, { status: 201 });
}
