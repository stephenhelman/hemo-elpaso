import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { BoardRoleType } from "@prisma/client";
import { assignBoardRole } from "@/lib/board/assign";

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

  const result = await assignBoardRole({
    patientId,
    role,
    fromEmail,
    admin: { id: admin!.id, email: admin!.email },
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ boardRole: result.boardRole }, { status: 201 });
}
