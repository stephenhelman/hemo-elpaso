import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { pollId: string } },
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
    const { active } = body;

    const poll = await prisma.poll.update({
      where: { id: params.pollId },
      data: {
        active,
        status: active ? "active" : "approved",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: active
          ? AuditAction.POLL_ACTIVATED
          : AuditAction.POLL_DEACTIVATED,
        resourceType: "Poll",
        resourceId: params.pollId,
        details: `${active ? "Activated" : "Deactivated"} poll: ${poll.questionEs}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Poll toggle error:", error);
    return NextResponse.json(
      { error: "Failed to toggle poll" },
      { status: 500 },
    );
  }
}
