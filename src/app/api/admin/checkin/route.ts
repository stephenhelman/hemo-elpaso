import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is board/admin
    const admin = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!admin || !["board", "admin"].includes(admin.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { qrCode, eventId } = body;

    // Parse QR code (format: "RSVP-{rsvpId}")
    if (!qrCode.startsWith("RSVP-")) {
      return NextResponse.json(
        { error: "Invalid QR code format" },
        { status: 400 },
      );
    }

    const rsvpId = qrCode.replace("RSVP-", "");

    // Get RSVP with patient and event info
    const rsvp = await prisma.rsvp.findUnique({
      where: { id: rsvpId },
      include: {
        patient: {
          include: {
            profile: true,
          },
        },
        event: true,
      },
    });

    if (!rsvp) {
      return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
    }

    // Verify RSVP is for the correct event
    if (rsvp.eventId !== eventId) {
      return NextResponse.json(
        {
          error: `This QR code is for "${rsvp.event.titleEn}", not the current event`,
        },
        { status: 400 },
      );
    }

    // Check if already checked in
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        eventId,
        patientId: rsvp.patientId,
      },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        {
          error: "Already checked in",
          patientName: `${rsvp.patient.profile?.firstName} ${rsvp.patient.profile?.lastName}`,
        },
        { status: 409 },
      );
    }

    // Create check-in record
    const checkIn = await prisma.checkIn.create({
      data: {
        eventId,
        patientId: rsvp.patientId,
        checkedInBy: admin.email, // REMOVE THIS - field doesn't exist
        sessionToken: crypto.randomUUID(), // ADD THIS
        sessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // ADD THIS - expires in 24 hours
      },
    });

    // And in the response:
    return NextResponse.json({
      success: true,
      patientName: `${rsvp.patient.profile?.firstName} ${rsvp.patient.profile?.lastName}`,
      checkIn: {
        id: checkIn.id,
        checkInTime: checkIn.checkInTime, // Changed from checkedInAt
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}
