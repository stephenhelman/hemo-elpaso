import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { sendRsvpConfirmation, sendEmail } from "@/lib/email-service";
import { AuditAction } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
      include: { contactProfile: true, disorderProfile: true },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (patient.disorderProfile?.condition) {
      // Has a bleeding disorder - check if verified or within grace period
      const gracePeriodEnded = patient.diagnosisGracePeriodEndsAt
        ? new Date(patient.diagnosisGracePeriodEndsAt) < new Date()
        : false;

      if (!patient.disorderProfile?.diagnosisVerified && gracePeriodEnded) {
        return NextResponse.json(
          {
            error:
              "Diagnosis verification required. Please upload your diagnosis letter to RSVP for events.",
            code: "VERIFICATION_REQUIRED",
          },
          { status: 403 },
        );
      }
    }

    const body = await request.json();
    const { eventId, attendeeCount, dietaryRestrictions, accessibilityNeeds } =
      body;

    // Validate
    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Find event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if already RSVPed
    const existingRsvp = await prisma.rsvp.findFirst({
      where: {
        patientId: patient.id,
        eventId: event.id,
      },
    });

    if (existingRsvp) {
      return NextResponse.json({ error: "Already RSVPed" }, { status: 400 });
    }

    // Check capacity
    if (event.maxCapacity) {
      const currentRsvps = await prisma.rsvp.count({
        where: { eventId: event.id },
      });

      if (currentRsvps >= event.maxCapacity) {
        return NextResponse.json(
          { error: "Event is at capacity" },
          { status: 400 },
        );
      }
    }

    // Create RSVP
    const rsvp = await prisma.rsvp.create({
      data: {
        patientId: patient.id,
        eventId: event.id,
        status: "confirmed",
        attendeeCount: attendeeCount || 1,
        dietaryRestrictions,
        specialNeeds: accessibilityNeeds,
        rsvpDate: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: AuditAction.RSVP_CREATED,
        resourceType: "Rsvp",
        resourceId: rsvp.id,
        details: `RSVPed for event: ${event.titleEn}`,
      },
    });

    // SEND RSVP CONFIRMATION EMAIL
    try {
      await sendRsvpConfirmation({
        recipient: patient.email,
        patientName: `${patient.contactProfile?.firstName} ${patient.contactProfile?.lastName}`,
        eventTitle: event.titleEn,
        eventDate: event.eventDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        eventTime: event.eventDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        location: event.location || "TBD",
        adultsCount: attendeeCount || 1,
        childrenCount: 0,
        eventSlug: event.slug,
        patientId: patient.id,
        eventId: event.id,
      });
    } catch (emailError) {
      console.error("Failed to send RSVP confirmation email:", emailError);
      // Don't fail the RSVP if email fails
    }

    return NextResponse.json({
      success: true,
      rsvpId: rsvp.id,
    });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json(
      { error: "Failed to create RSVP" },
      { status: 500 },
    );
  }
}

// ADD DELETE METHOD FOR CANCELLATION
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
      include: { contactProfile: true },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const rsvpId = searchParams.get("rsvpId");

    if (!rsvpId) {
      return NextResponse.json({ error: "RSVP ID required" }, { status: 400 });
    }

    // Find RSVP with event details
    const rsvp = await prisma.rsvp.findUnique({
      where: { id: rsvpId },
      include: {
        event: true,
      },
    });

    if (!rsvp || rsvp.patientId !== patient.id) {
      return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
    }

    // Delete RSVP
    await prisma.rsvp.delete({
      where: { id: rsvpId },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: AuditAction.RSVP_CANCELLED,
        resourceType: "Rsvp",
        resourceId: rsvp.id,
        details: `Cancelled RSVP for event: ${rsvp.event.titleEn}`,
      },
    });

    // SEND CANCELLATION EMAIL
    try {
      await sendEmail({
        templateType: "RSVP_CANCELLATION",
        recipient: patient.email,
        data: {
          patientName: `${patient.contactProfile?.firstName} ${patient.contactProfile?.lastName}`,
          eventTitle: rsvp.event.titleEn,
          eventDate: rsvp.event.eventDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          eventTime: rsvp.event.eventDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          eventSlug: rsvp.event.slug,
        },
        patientId: patient.id,
        eventId: rsvp.eventId,
      });
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RSVP cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel RSVP" },
      { status: 500 },
    );
  }
}
