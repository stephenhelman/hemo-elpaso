import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function DELETE(
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

    const poll = await prisma.eventInteraction.findUnique({
      where: { id: params.pollId },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Delete in transaction: responses first, then poll
    await prisma.$transaction([
      // Delete all responses for this poll
      prisma.interactionResponse.deleteMany({
        where: { interactionId: params.pollId },
      }),
      // Then delete the poll
      prisma.eventInteraction.delete({
        where: { id: params.pollId },
      }),
    ]);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: "poll_deleted",
        resourceType: "EventInteraction",
        resourceId: params.pollId,
        details: `Deleted poll: ${poll.titleEn}`,
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
