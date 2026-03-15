import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";

interface Props {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Props) {
  // Validate session token from header
  const sessionToken = req.headers.get("x-session-token");

  if (!sessionToken) {
    return NextResponse.json(
      { error: "Session token required" },
      { status: 401 },
    );
  }

  // Verify this is a valid checked-in session for this event
  const checkIn = await prisma.checkIn.findFirst({
    where: {
      sessionToken,
      eventId: params.id,
      sessionExpiresAt: { gt: new Date() },
    },
  });

  if (!checkIn) {
    return NextResponse.json(
      { error: "Invalid or expired session" },
      { status: 401 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  const caption = formData.get("caption") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No photo provided" }, { status: 400 });
  }

  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WebP, or HEIC photos are accepted" },
      { status: 400 },
    );
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Photo must be under 10MB" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const key = `events/${params.id}/live-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const url = await uploadToR2(buffer, key, file.type);

  const photo = await prisma.eventPhoto.create({
    data: {
      eventId: params.id,
      url,
      key,
      caption: caption || null,
      uploadedBy: `session:${sessionToken}`,
      approved: false, // Hidden until admin approves
      sessionToken, // Track who uploaded
      source: "live", // Mark as live upload
    },
  });

  return NextResponse.json({
    success: true,
    message:
      "Photo uploaded successfully. It will appear in the gallery once approved.",
    photoId: photo.id,
  });
}
