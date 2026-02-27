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

    const poll = await prisma.poll.update({
      where: { id: params.pollId },
      data: { status: "approved" },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.POLL_APPROVED,
        resourceType: "Poll",
        resourceId: params.pollId,
        details: `Approved poll from rep: ${poll.questionEn}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Poll approval error:", error);
    return NextResponse.json(
      { error: "Failed to approve poll" },
      { status: 500 },
    );
  }
}
