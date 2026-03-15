import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pusherServer, eventChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

interface Props {
  params: { token: string };
}

async function verifyPresenterToken(token: string) {
  const presenterToken = await prisma.presenterAccessToken.findUnique({
    where: { token },
    include: { event: true },
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

  const body = await req.json();
  const { action, slideIndex } = body;
  const eventId = presenterToken.eventId;

  const presentation = await prisma.eventPresentation.findUnique({
    where: { eventId },
  });

  // Toggle live
  if (action === "toggle-live") {
    const updated = presentation
      ? await prisma.eventPresentation.update({
          where: { eventId },
          data: { isLive: !presentation.isLive },
        })
      : await prisma.eventPresentation.create({
          data: { eventId, isLive: true },
        });

    // Trigger Pusher — all attendees immediately see live status change
    await pusherServer.trigger(
      eventChannel(eventId),
      PUSHER_EVENTS.PRESENTATION_LIVE,
      { isLive: updated.isLive },
    );

    return NextResponse.json({ presentation: updated });
  }

  if (!presentation) {
    return NextResponse.json(
      { error: "No presentation uploaded yet" },
      { status: 400 },
    );
  }

  // Slide navigation
  let newSlide = presentation.currentSlide;

  if (action === "next") {
    const maxSlide =
      Math.max(presentation.totalSlidesEn, presentation.totalSlidesEs) - 1;
    newSlide = Math.min(presentation.currentSlide + 1, maxSlide);
  } else if (action === "prev") {
    newSlide = Math.max(presentation.currentSlide - 1, 0);
  } else if (action === "goto" && slideIndex !== undefined) {
    const maxSlide =
      Math.max(presentation.totalSlidesEn, presentation.totalSlidesEs) - 1;
    newSlide = Math.max(0, Math.min(slideIndex, maxSlide));
  }

  const updated = await prisma.eventPresentation.update({
    where: { eventId },
    data: { currentSlide: newSlide },
  });

  // Trigger Pusher — all attendees instantly advance their slide
  await pusherServer.trigger(
    eventChannel(eventId),
    PUSHER_EVENTS.SLIDE_CHANGED,
    { currentSlide: newSlide },
  );

  return NextResponse.json({ presentation: updated });
}
