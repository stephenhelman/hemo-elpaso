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

    const admin = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!admin || !["board", "admin"].includes(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { rsvpId, eventId, attendeeRole } = body; // ADD attendeeRole

    // Get RSVP to find patient
    const rsvp = await prisma.rsvp.findUnique({
      where: { id: rsvpId },
    });

    if (!rsvp) {
      return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
    }

    // Check if already checked in
    const existing = await prisma.checkIn.findUnique({
      where: {
        eventId_patientId: {
          eventId: eventId,
          patientId: rsvp.patientId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already checked in" },
        { status: 409 },
      );
    }

    // Create check-in
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.checkIn.create({
      data: {
        eventId: eventId,
        patientId: rsvp.patientId,
        sessionToken,
        sessionExpiresAt,
        checkedInBy: admin.email,
        attendeeRole: attendeeRole || "patient", // ADD THIS - default to 'patient' for backward compatibility
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: "manual_checkin",
        resourceType: "CheckIn",
        resourceId: rsvp.patientId,
        details: `Manually checked in patient${attendeeRole ? ` as ${attendeeRole}` : ""}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Manual check-in error:", error);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!admin || !["board", "admin"].includes(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const checkInId = searchParams.get("id");

    if (!checkInId) {
      return NextResponse.json(
        { error: "Check-in ID required" },
        { status: 400 },
      );
    }

    await prisma.checkIn.delete({
      where: { id: checkInId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: "checkin_removed",
        resourceType: "CheckIn",
        resourceId: checkInId,
        details: "Manual check-in removed",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Check-out error:", error);
    return NextResponse.json(
      { error: "Failed to remove check-in" },
      { status: 500 },
    );
  }
}
