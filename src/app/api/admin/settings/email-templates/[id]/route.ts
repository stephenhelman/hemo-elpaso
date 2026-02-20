import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
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
        action: "email_template_updated",
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
