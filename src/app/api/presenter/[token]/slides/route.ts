import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";
import sharp from "sharp";

interface Props {
  params: { token: string };
}

// Verify token helper
async function verifyPresenterToken(token: string) {
  const presenterToken = await prisma.presenterAccessToken.findUnique({
    where: { token },
    include: { event: true },
  });

  if (!presenterToken || presenterToken.expiresAt < new Date()) {
    return null;
  }

  return presenterToken;
}

// -------------------------------------------------------
// PATCH /api/presenter/[token]/slide
// Advance or set current slide
// -------------------------------------------------------
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
  // action: "next" | "prev" | "goto" | "toggle-live"

  const presentation = await prisma.eventPresentation.findUnique({
    where: { eventId: presenterToken.eventId },
  });

  if (!presentation && action !== "toggle-live") {
    return NextResponse.json(
      { error: "No presentation uploaded yet" },
      { status: 400 },
    );
  }

  if (action === "toggle-live") {
    const current = await prisma.eventPresentation.findUnique({
      where: { eventId: presenterToken.eventId },
    });

    if (!current) {
      // Create empty presentation
      const created = await prisma.eventPresentation.create({
        data: { eventId: presenterToken.eventId, isLive: true },
      });
      return NextResponse.json({ presentation: created });
    }

    const updated = await prisma.eventPresentation.update({
      where: { eventId: presenterToken.eventId },
      data: { isLive: !current.isLive },
    });
    return NextResponse.json({ presentation: updated });
  }

  let newSlide = presentation!.currentSlide;

  if (action === "next") {
    newSlide = Math.min(
      presentation!.currentSlide + 1,
      presentation!.totalSlides - 1,
    );
  } else if (action === "prev") {
    newSlide = Math.max(presentation!.currentSlide - 1, 0);
  } else if (action === "goto" && slideIndex !== undefined) {
    newSlide = Math.max(0, Math.min(slideIndex, presentation!.totalSlides - 1));
  }

  const updated = await prisma.eventPresentation.update({
    where: { eventId: presenterToken.eventId },
    data: { currentSlide: newSlide },
  });

  return NextResponse.json({ presentation: updated });
}
