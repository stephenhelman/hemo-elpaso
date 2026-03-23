import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;

  const { action, notes } = await req.json(); // action: "approve" | "deny"
  if (!["approve", "deny"].includes(action)) {
    return NextResponse.json({ error: "action must be 'approve' or 'deny'" }, { status: 400 });
  }

  const approval = await prisma.boardApproval.findUnique({ where: { id: params.id } });
  if (!approval) return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  if (approval.status !== "PENDING") {
    return NextResponse.json({ error: "Approval already resolved" }, { status: 409 });
  }

  const newStatus = action === "approve" ? "APPROVED" : "DENIED";

  await prisma.boardApproval.update({
    where: { id: params.id },
    data: {
      status: newStatus,
      reviewedBy: admin!.email,
      reviewedAt: new Date(),
      notes: notes || null,
    },
  });

  if (action === "approve" && approval.resourceId) {
    await prisma.familyMembership.update({
      where: { id: approval.resourceId },
      data: {
        status: "DETACHED",
        detachedAt: new Date(),
        detachedBy: admin!.email,
        boardApprovalId: approval.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        patientId: admin!.id,
        action: AuditAction.FAMILY_MEMBER_DETACHED,
        resourceType: "FamilyMembership",
        resourceId: approval.resourceId,
        details: `Family detachment approved by ${admin!.email}`,
      },
    });
  } else {
    await prisma.auditLog.create({
      data: {
        patientId: admin!.id,
        action: AuditAction.BOARD_APPROVAL_DENIED,
        resourceType: "BoardApproval",
        resourceId: approval.id,
        details: `Family detachment denied by ${admin!.email}`,
      },
    });
  }

  return NextResponse.json({ success: true, status: newStatus });
}
