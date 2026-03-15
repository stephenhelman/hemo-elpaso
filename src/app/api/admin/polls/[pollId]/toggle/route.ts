import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { pusherServer, eventChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { pollId: string } },
) {
  try {
    const { admin, error } = await import("@/lib/permissions").then((m) =>
      m.requirePermission("canManageEvents"),
    );
    if (error) return error;

    const body = await request.json();
    const { active } = body;

    const poll = await prisma.poll.update({
      where: { id: params.pollId },
      data: {
        active,
        status: active ? "active" : "approved",
      },
      include: {
        options: true,
        responses: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        patientId: admin!.id,
        action: active
          ? AuditAction.POLL_ACTIVATED
          : AuditAction.POLL_DEACTIVATED,
        resourceType: "Poll",
        resourceId: params.pollId,
        details: `Poll ${active ? "activated" : "deactivated"}: ${poll.questionEn}`,
      },
    });

    // Trigger Pusher — Polls tab appears/disappears instantly for all attendees
    await pusherServer.trigger(
      eventChannel(poll.eventId),
      active ? PUSHER_EVENTS.POLL_ACTIVATED : PUSHER_EVENTS.POLL_DEACTIVATED,
      {
        poll: {
          id: poll.id,
          questionEn: poll.questionEn,
          questionEs: poll.questionEs,
          options: poll.options.map((opt) => ({
            id: opt.id,
            textEn: opt.textEn,
            textEs: opt.textEs,
            voteCount: poll.responses.filter(
              (r) => r.selectedOptionId === opt.id,
            ).length,
          })),
          totalResponses: poll.responses.length,
        },
      },
    );

    return NextResponse.json({ poll });
  } catch (error) {
    console.error("Poll toggle error:", error);
    return NextResponse.json(
      { error: "Failed to toggle poll" },
      { status: 500 },
    );
  }
}
