import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";
import { AuditAction } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { admin, error } = await requirePermission("canManageVolunteers");
  if (error) return error;

  const { action, rejectionReason } = await req.json();

  const profile = await prisma.volunteerProfile.findUnique({
    where: { id: params.id },
    include: { patient: { include: { contactProfile: true } } },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    await prisma.volunteerProfile.update({
      where: { id: params.id },
      data: { status: "APPROVED", approvedBy: admin!.email, approvedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: {
        patientId: admin!.id,
        action: AuditAction.VOLUNTEER_APPROVED,
        resourceType: "VolunteerProfile",
        resourceId: params.id,
        details: `Approved volunteer: ${profile.patient.contactProfile?.firstName} ${profile.patient.contactProfile?.lastName}`,
      },
    });
    try {
      await sendEmail({
        templateType: "VOLUNTEER_APPROVED",
        recipient: profile.patient.email,
        data: {
          patientName: `${profile.patient.contactProfile?.firstName} ${profile.patient.contactProfile?.lastName}`,
        },
        patientId: profile.patientId,
      });
    } catch { /* non-fatal */ }
  } else if (action === "reject") {
    await prisma.volunteerProfile.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        rejectedBy: admin!.email,
        rejectedAt: new Date(),
        rejectionReason: rejectionReason || null,
      },
    });
    await prisma.auditLog.create({
      data: {
        patientId: admin!.id,
        action: AuditAction.VOLUNTEER_REJECTED,
        resourceType: "VolunteerProfile",
        resourceId: params.id,
        details: `Rejected volunteer: ${profile.patient.contactProfile?.firstName} ${profile.patient.contactProfile?.lastName}`,
      },
    });
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
