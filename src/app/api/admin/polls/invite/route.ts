import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { AuditAction } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) return error;

    const body = await request.json();
    const { eventId, repEmail, repName } = body;

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Create token record
    await prisma.pollCreationToken.create({
      data: {
        eventId,
        token,
        repEmail,
        repName: repName || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdBy: admin.email,
      },
    });

    // Generate link
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://hemo-el-paso.org";
    const link = `${baseUrl}/event-polls/${token}`;

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.POLL_INVITE_SENT,
        resourceType: "PollCreationToken",
        resourceId: token,
        details: `Generated poll creation link for ${repEmail}`,
      },
    });

    return NextResponse.json({ success: true, link, token });
  } catch (error) {
    console.error("Invite generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate invite" },
      { status: 500 },
    );
  }
}
