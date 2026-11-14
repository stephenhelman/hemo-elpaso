import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { hashToken, looksLikeToken } from "@/lib/tokens";
import { eventHasEnded } from "@/lib/rsvp/window";

/**
 * Hosted QR image for emails (Gmail blocks data: URLs).
 * The QR payload is the RAW check-in token and nothing else: no patient id,
 * name or diagnosis. Only valid (active, event not ended) tokens get an image.
 */
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const notFound = () => new NextResponse(null, { status: 404 });
  if (!looksLikeToken(params.token)) return notFound();

  const rsvp = await prisma.rsvp.findUnique({
    where: { checkInTokenHash: hashToken(params.token) },
    select: { cancelledAt: true, event: { select: { eventDate: true, endDate: true } } },
  });
  if (!rsvp || rsvp.cancelledAt || eventHasEnded(rsvp.event)) return notFound();

  const png = await QRCode.toBuffer(params.token, {
    type: "png",
    width: 440,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
      "Referrer-Policy": "no-referrer",
    },
  });
}
