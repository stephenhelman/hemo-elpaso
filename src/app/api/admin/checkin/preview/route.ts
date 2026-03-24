import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { error } = await requirePermission("canManageEvents");
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const qrCode = searchParams.get("qrCode");
    const eventId = searchParams.get("eventId");

    if (!qrCode || !eventId) {
      return NextResponse.json(
        { error: "qrCode and eventId are required" },
        { status: 400 },
      );
    }

    if (!qrCode.startsWith("RSVP-")) {
      return NextResponse.json(
        { error: "Invalid QR code format" },
        { status: 400 },
      );
    }

    const rsvpId = qrCode.replace("RSVP-", "");

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

    if (rsvp.eventId !== eventId) {
      return NextResponse.json(
        {
          error: `This QR code is for "${rsvp.event.titleEn}", not the current event`,
        },
        { status: 400 },
      );
    }

    const patientName = `${rsvp.patient.contactProfile?.firstName} ${rsvp.patient.contactProfile?.lastName}`;

    // Check if already checked in
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        eventId,
        patientId: rsvp.patientId,
      },
    });

    if (existingCheckIn) {
      return NextResponse.json({ alreadyCheckedIn: true, patientName });
    }

    // Fetch family members from rsvp's familyMembershipIds
    const memberIds: string[] = Array.isArray(rsvp.familyMembershipIds)
      ? (rsvp.familyMembershipIds as string[])
      : [];

    const familyMembers = memberIds.length
      ? await prisma.familyMembership.findMany({
          where: { id: { in: memberIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            relationship: true,
            ageTier: true,
          },
        })
      : [];

    return NextResponse.json({
      rsvpId: rsvp.id,
      patientName,
      attendeeCount: rsvp.attendeeCount,
      familyMembers,
    });
  } catch (error) {
    console.error("Check-in preview error:", error);
    return NextResponse.json(
      { error: "Failed to load check-in preview" },
      { status: 500 },
    );
  }
}
