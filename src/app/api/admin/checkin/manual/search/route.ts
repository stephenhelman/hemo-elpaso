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
    const { eventId, patientId, attendeeRole } = body;

    // Check if already checked in
    const existing = await prisma.checkIn.findUnique({
      where: {
        eventId_patientId: {
          eventId,
          patientId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already checked in" },
        { status: 409 },
      );
    }

    if (attendeeRole === "patient") {
      const rsvp = await prisma.rsvp.findFirst({
        where: {
          eventId,
          patientId,
        },
      });

      if (!rsvp) {
        return NextResponse.json(
          { error: "No RSVP found. Patient must RSVP before checking in." },
          { status: 400 },
        );
      }
    }

    // Create check-in
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.checkIn.create({
      data: {
        eventId,
        patientId,
        sessionToken,
        sessionExpiresAt,
        checkedInBy: admin.email,
        attendeeRole: attendeeRole || "patient",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: "manual_checkin",
        resourceType: "CheckIn",
        resourceId: patientId,
        details: `Manually checked in as ${attendeeRole || "patient"}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Manual check-in error:", error);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}
