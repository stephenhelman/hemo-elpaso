import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { admin, error } = await requirePermission("canViewPHI");
    if (error) return error;

    const body = await request.json();
    const { action, rejectedReason, verifiedBy } = body;

    if (!["approve", "deny"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (action === "deny" && !rejectedReason) {
      return NextResponse.json(
        { error: "Rejection reason required" },
        { status: 400 },
      );
    }

    const familyMember = await prisma.familyMember.findUnique({
      where: { id: params.id },
      include: {
        contactProfile: true,
        patient: {
          include: { contactProfile: true },
        },
      },
    });

    if (!familyMember) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 },
      );
    }

    // Update verification status on DisorderProfile (where it now lives)
    await prisma.disorderProfile.update({
      where: { familyMemberId: params.id },
      data: {
        diagnosisVerified: action === "approve",
        diagnosisVerifiedBy: action === "approve" ? verifiedBy : null,
        diagnosisVerifiedAt: action === "approve" ? new Date() : null,
        diagnosisRejectedReason: action === "deny" ? rejectedReason : null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: (action === "approve"
          ? AuditAction.DIAGNOSIS_APPROVED_FAMILY
          : AuditAction.DIAGNOSIS_REJECTED_FAMILY) as any,
        resourceType: "FamilyMember",
        resourceId: familyMember.id,
        details: `${action === "approve" ? "Approved" : "Rejected"} diagnosis letter for ${familyMember.contactProfile?.firstName} ${familyMember.contactProfile?.lastName} (family of ${familyMember.patient.contactProfile?.firstName} ${familyMember.patient.contactProfile?.lastName})`,
      },
    });

    // TODO: Send email notification to patient

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Failed to update verification" },
      { status: 500 },
    );
  }
}
