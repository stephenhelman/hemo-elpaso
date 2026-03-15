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

// -------------------------------------------------------
// POST /api/presenter/[token]/slides/upload
// Upload slides (images or PDF → converted to images)
// -------------------------------------------------------
export async function POST(req: NextRequest, { params }: Props) {
  const presenterToken = await verifyPresenterToken(params.token);
  if (!presenterToken) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }

  const formData = await req.formData();
  const files = formData.getAll("slides") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const slideUrls: string[] = [];
  const eventId = presenterToken.eventId;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.type === "application/pdf") {
      // PDF → images via sharp (requires poppler/ghostscript on server)
      // For Vercel, use a conversion service or accept images only
      // TODO: integrate CloudConvert API for PDF support
      return NextResponse.json(
        {
          error:
            "PDF conversion requires CloudConvert integration. Please upload images directly for now.",
        },
        { status: 400 },
      );
    }

    // Process image — resize to presentation dimensions
    const processed = await sharp(buffer)
      .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const key = `events/${eventId}/slides/slide-${String(i + 1).padStart(3, "0")}.webp`;
    const url = await uploadToR2(processed, key, "image/webp");
    slideUrls.push(url);
  }

  // Upsert presentation record
  const presentation = await prisma.eventPresentation.upsert({
    where: { eventId },
    create: {
      eventId,
      slideUrls,
      totalSlides: slideUrls.length,
      currentSlide: 0,
    },
    update: {
      slideUrls,
      totalSlides: slideUrls.length,
      currentSlide: 0,
    },
  });

  return NextResponse.json({ presentation, slideCount: slideUrls.length });
}
