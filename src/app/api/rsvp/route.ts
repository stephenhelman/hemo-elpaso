import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { createRsvp, cancelRsvp } from "@/lib/rsvp";
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

    const body = await request.json();
    const {
      eventId,
      attendeeCount,
      familyMembershipIds,
      dietaryRestrictions,
      accessibilityNeeds,
    } = body;

    // Validate
    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Derive attendee count: selected family members + patient themselves
    const selectedMemberIds: string[] = Array.isArray(familyMembershipIds)
      ? familyMembershipIds
      : [];
    const finalAttendeeCount = attendeeCount ?? selectedMemberIds.length + 1;

    // Eligibility (event exists, not duplicate, deadline, capacity), create,
    // audit log and confirmation email all live in src/lib/rsvp.
    const result = await createRsvp({
      eventId,
      patientId: patient.id,
      attendeeCount: finalAttendeeCount,
      familyMembershipIds: selectedMemberIds,
      dietaryRestrictions,
      specialNeeds: accessibilityNeeds,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status },
      );
    }
    const rsvp = result.rsvp;

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

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const patient = await prisma.patient.findUnique({ where: { auth0Id: session.user.sub } });
    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

    const { rsvpId, familyMembershipIds } = await request.json();
    if (!rsvpId) return NextResponse.json({ error: "RSVP ID required" }, { status: 400 });

    const rsvp = await prisma.rsvp.findUnique({
      where: { id: rsvpId },
      include: { event: true },
    });

    if (!rsvp || rsvp.patientId !== patient.id) {
      return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
    }

    // Can't change after event has passed
    if (new Date(rsvp.event.eventDate) < new Date()) {
      return NextResponse.json({ error: "Cannot change RSVP after event has passed" }, { status: 400 });
    }

    const selectedIds: string[] = Array.isArray(familyMembershipIds) ? familyMembershipIds : [];
    const newAttendeeCount = selectedIds.length + 1; // members + patient

    const updated = await prisma.rsvp.update({
      where: { id: rsvpId },
      data: {
        familyMembershipIds: selectedIds,
        attendeeCount: newAttendeeCount,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: AuditAction.RSVP_UPDATED,
        resourceType: "Rsvp",
        resourceId: rsvpId,
        details: `Updated RSVP family selection for: ${rsvp.event.titleEn}`,
      },
    });

    return NextResponse.json({ success: true, attendeeCount: updated.attendeeCount });
  } catch (error) {
    console.error("RSVP update error:", error);
    return NextResponse.json({ error: "Failed to update RSVP" }, { status: 500 });
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
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const rsvpId = searchParams.get("rsvpId");

    if (!rsvpId) {
      return NextResponse.json({ error: "RSVP ID required" }, { status: 400 });
    }

    const rsvp = await prisma.rsvp.findUnique({ where: { id: rsvpId } });

    if (!rsvp || rsvp.patientId !== patient.id) {
      return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
    }

    await cancelRsvp({ rsvpId, actorId: patient.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RSVP cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel RSVP" },
      { status: 500 },
    );
  }
}
