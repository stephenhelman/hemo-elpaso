import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { notifyOfficersOfAdminAction } from "@/lib/admin-notice";

interface Props {
  params: { roleId: string };
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { error } = await requirePermission("canAssignBoardRoles");
  if (error) return error;

  const body = await req.json();
  const { fromEmail } = body;

  const updated = await prisma.boardRole.update({
    where: { id: params.roleId },
    data: {
      ...(fromEmail !== undefined && { fromEmail: fromEmail || null }),
    },
    include: { patient: { include: { contactProfile: true } } },
  });

  return NextResponse.json({ boardRole: updated });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const { admin, error } = await requirePermission("canAssignBoardRoles");
  if (error) return error;

  const boardRole = await prisma.boardRole.findUnique({
    where: { id: params.roleId },
    include: { patient: { include: { contactProfile: true } } },
  });

  if (!boardRole) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft delete — mark inactive to preserve history
  await prisma.boardRole.update({
    where: { id: params.roleId },
    data: { active: false },
  });

  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.BOARD_ROLE_REMOVED,
      resourceType: "BoardRole",
      resourceId: params.roleId,
      details: `Role ${boardRole.role} removed from patient ${boardRole.patientId} by ${admin!.email}`,
    },
  });

  // Last active role gone -> no more board access (admins are never downgraded).
  const remaining = await prisma.boardRole.count({
    where: { patientId: boardRole.patientId, active: true },
  });
  let demoted = false;
  if (remaining === 0) {
    const res = await prisma.patient.updateMany({
      where: { id: boardRole.patientId, role: "board" },
      data: { role: "patient" },
    });
    demoted = res.count > 0;
  }

  void notifyOfficersOfAdminAction({
    subjectEn: "Board role removed", subjectEs: "Cargo de la junta retirado",
    linesEn: [`${admin!.email} removed the role ${boardRole.role} (record ${params.roleId}).`],
    linesEs: [`${admin!.email} retiró el cargo ${boardRole.role} (registro ${params.roleId}).`],
  });

  return NextResponse.json({
    success: true,
    demoted,
    // The app can't edit the Auth0 Action: remind the admin to do it by hand.
    reminder: demoted
      ? `Also remove ${boardRole.patient.email ?? "this person"} from BOARD_ALLOWLIST in the Auth0 Action.`
      : null,
  });
}
