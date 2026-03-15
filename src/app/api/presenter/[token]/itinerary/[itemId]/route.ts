import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { pusherServer, eventChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

interface Props {
  params: { token: string; itemId: string };
}

async function verifyPresenterToken(token: string) {
  const presenterToken = await prisma.presenterAccessToken.findUnique({
    where: { token },
  });
  if (!presenterToken || presenterToken.expiresAt < new Date()) return null;
  return presenterToken;
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const presenterToken = await verifyPresenterToken(params.token);
  if (!presenterToken) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }

  const { status } = await req.json();
  const validStatuses = ["scheduled", "current", "completed", "skipped"];

  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const item = await prisma.eventItineraryItem.findFirst({
    where: { id: params.itemId, eventId: presenterToken.eventId },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // If marking as current, set any previous "current" to "completed"
  if (status === "current") {
    await prisma.eventItineraryItem.updateMany({
      where: { eventId: presenterToken.eventId, status: "current" },
      data: { status: "completed" },
    });
  }

  const updated = await prisma.eventItineraryItem.update({
    where: { id: params.itemId },
    data: { status },
  });

  // Trigger Pusher — agenda highlights current item for all attendees
  await pusherServer.trigger(
    eventChannel(presenterToken.eventId),
    PUSHER_EVENTS.ITINERARY_UPDATED,
    {
      itemId: params.itemId,
      status,
    },
  );

  return NextResponse.json({ item: updated });
}
