import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

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
  // status: "scheduled" | "current" | "completed" | "skipped"

  const validStatuses = ["scheduled", "current", "completed", "skipped"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Verify this itinerary item belongs to the event
  const item = await prisma.eventItineraryItem.findFirst({
    where: {
      id: params.itemId,
      eventId: presenterToken.eventId,
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // If marking as "current", set all others to appropriate status
  if (status === "current") {
    await prisma.eventItineraryItem.updateMany({
      where: {
        eventId: presenterToken.eventId,
        status: "current",
      },
      data: { status: "completed" },
    });
  }

  const updated = await prisma.eventItineraryItem.update({
    where: { id: params.itemId },
    data: { status },
  });

  return NextResponse.json({ item: updated });
}
