import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";
import { AuditAction } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) return error;

    const body = await request.json();
    const { qrCode, eventId, confirmedMembershipIds } = body;

    // Handle volunteer QR codes: "VOLUNTEER-{assignmentId}"
    if (qrCode.startsWith("VOLUNTEER-")) {
      const assignmentId = qrCode.replace("VOLUNTEER-", "");
      const assignment = await prisma.volunteerEventAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          volunteerProfile: { include: { patient: { include: { contactProfile: true } } } },
          event: true,
        },
      });
      if (!assignment) {
        return NextResponse.json({ error: "Volunteer assignment not found" }, { status: 404 });
      }
      if (assignment.eventId !== eventId) {
        return NextResponse.json(
          { error: "QR code is for a different event" },
          { status: 400 },
        );
      }

      // Check for existing active timecard
      const existing = await prisma.volunteerTimecard.findFirst({
        where: {
          volunteerProfileId: assignment.volunteerProfileId,
          eventId,
          checkOutTime: null,
        },
      });
      const vp = assignment.volunteerProfile;
      const volunteerName = vp.patient
        ? `${vp.patient.contactProfile?.firstName ?? ""} ${vp.patient.contactProfile?.lastName ?? ""}`.trim()
        : (vp.contactName ?? "Community Volunteer");

      if (existing) {
        return NextResponse.json(
          { alreadyCheckedIn: true, patientName: volunteerName },
          { status: 200 },
        );
      }

      const timecard = await prisma.volunteerTimecard.create({
        data: { volunteerProfileId: assignment.volunteerProfileId, eventId, status: "active" },
      });

      await prisma.auditLog.create({
        data: {
          patientId: admin!.id,
          action: AuditAction.VOLUNTEER_CHECKED_IN,
          resourceType: "VolunteerTimecard",
          resourceId: timecard.id,
          details: `Volunteer ${volunteerName} checked in to ${assignment.event.titleEn}`,
        },
      });

      return NextResponse.json({
        success: true,
        isVolunteer: true,
        patientName: volunteerName,
        timecardId: timecard.id,
      });
    }

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
        checkedInBy: admin!.email,
        sessionToken: crypto.randomUUID(),
        sessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        familyMembershipIds: confirmedMembershipIds ?? [],
      },
    });

    // Fetch confirmed family member names for the response
    const confirmedMembers: { id: string; firstName: string; lastName: string }[] =
      confirmedMembershipIds?.length
        ? await prisma.familyMembership.findMany({
            where: { id: { in: confirmedMembershipIds } },
            select: { id: true, firstName: true, lastName: true },
          })
        : [];

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin!.id,
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
      confirmedMembers,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}
