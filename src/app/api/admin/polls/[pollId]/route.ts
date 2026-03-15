import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { pollId: string } },
) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) return error;

    const poll = await prisma.poll.findUnique({
      where: { id: params.pollId },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Delete in transaction: responses first, then poll
    await prisma.$transaction([
      // Delete all responses for this poll
      prisma.pollResponse.deleteMany({
        where: { pollId: params.pollId },
      }),
      // Then delete the poll
      prisma.poll.delete({
        where: { id: params.pollId },
      }),
    ]);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.POLL_DELETED,
        resourceType: "Poll",
        resourceId: params.pollId,
        details: `Deleted poll: ${poll.questionEn}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Poll deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete poll" },
      { status: 500 },
    );
  }
}
