import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

interface Props {
  params: { data: string };
}

// Generates a QR code PNG on the fly for any data string
// Used as an <img src> in emails and the portal
// e.g. /api/qr/RSVP-abc123 → PNG image
// No storage, no cleanup, works in all email clients

export async function GET(req: NextRequest, { params }: Props) {
  try {
    const data = decodeURIComponent(params.data);

    const png = await QRCode.toBuffer(data, {
      type: "png",
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return new NextResponse(png, {
      headers: {
        "Content-Type": "image/png",
        // Cache immutably — RSVP-{id} never changes for a given RSVP
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("QR generation error:", err);
    return new NextResponse("Failed to generate QR code", { status: 500 });
  }
}
