import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get patient
    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Get RSVP and verify ownership
    const rsvp = await prisma.rsvp.findUnique({
      where: { id: params.id },
      include: {
        event: true,
      },
    });

    if (!rsvp || rsvp.patientId !== patient.id) {
      return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
    }

    // Generate QR code
    const qrData = `RSVP-${rsvp.id}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: "#8B1538", // primary color
        light: "#FFFFFF",
      },
    });

    // Return as JSON with data URL (can be used in <img src={...}>)
    return NextResponse.json({
      qrCode: qrCodeDataURL,
      rsvpId: rsvp.id,
      eventTitle: rsvp.event.titleEn,
    });
  } catch (error) {
    console.error("QR code generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 },
    );
  }
}
