import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { admin, error } = await requirePermission("canManageEmailTemplates");
    if (error) return error;

    const body = await request.json();
    const { enabled, subject } = body;

    // Update template
    const updated = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: {
        ...(typeof enabled === "boolean" && { enabled }),
        ...(subject && { subject }),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.EMAIL_TEMPLATE_UPDATED,
        resourceType: "EmailTemplate",
        resourceId: updated.id,
        details: `Updated email template: ${updated.name}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Template update error:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 },
    );
  }
}
