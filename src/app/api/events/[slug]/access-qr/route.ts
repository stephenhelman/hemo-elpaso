import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const event = await prisma.event.findUnique({
      where: { slug: params.slug },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Generate QR code with URL to live event page
    const liveUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://hemo-elpaso.vercel.app"}/events/${event.slug}/live`;

    const qrCodeDataURL = await QRCode.toDataURL(liveUrl, {
      width: 800, // Larger for projection
      margin: 4,
      color: {
        dark: "#8B1538",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      qrCode: qrCodeDataURL,
      liveUrl,
      eventTitle: event.titleEn,
    });
  } catch (error) {
    console.error("Event access QR generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 },
    );
  }
}
