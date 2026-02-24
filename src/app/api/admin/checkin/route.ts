import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";
import { AuditAction } from "@prisma/client";

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
            contactProfile: true,
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
          patientName: `${rsvp.patient.contactProfile?.firstName} ${rsvp.patient.contactProfile?.lastName}`,
        },
        { status: 409 },
      );
    }

    // Create check-in record
    const checkIn = await prisma.checkIn.create({
      data: {
        eventId,
        patientId: rsvp.patientId,
        checkedInBy: admin.email,
        sessionToken: crypto.randomUUID(),
        sessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.CHECKIN_CREATED,
        resourceType: "CheckIn",
        resourceId: checkIn.id,
        details: `Checked in ${rsvp.patient.contactProfile?.firstName} ${rsvp.patient.contactProfile?.lastName} for ${rsvp.event.titleEn}`,
      },
    });

    // UPDATED: Send check-in confirmation email using email service
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "https://hemo-elpaso.vercel.app";

      await sendEmail({
        templateType: "CHECK_IN_CONFIRMATION",
        recipient: rsvp.patient.email,
        data: {
          patientName: `${rsvp.patient.contactProfile?.firstName} ${rsvp.patient.contactProfile?.lastName}`,
          eventTitle: rsvp.event.titleEn,
          eventDate: new Date(rsvp.event.eventDate).toLocaleDateString(
            "en-US",
            {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            },
          ),
          eventTime: new Date(rsvp.event.eventDate).toLocaleTimeString(
            "en-US",
            {
              hour: "numeric",
              minute: "2-digit",
            },
          ),
          location: rsvp.event.location || "TBD",
          checkInTime: new Date(checkIn.checkInTime).toLocaleTimeString(
            "en-US",
            {
              hour: "numeric",
              minute: "2-digit",
            },
          ),
          liveEventUrl: `${baseUrl}/events/${rsvp.event.slug}/live`,
        },
        patientId: rsvp.patientId,
        eventId: eventId,
      });
    } catch (emailError) {
      console.error("Check-in email error:", emailError);
      // Don't fail the check-in if email fails
    }

    return NextResponse.json({
      success: true,
      patientName: `${rsvp.patient.contactProfile?.firstName} ${rsvp.patient.contactProfile?.lastName}`,
      checkIn: {
        id: checkIn.id,
        checkInTime: checkIn.checkInTime,
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}
