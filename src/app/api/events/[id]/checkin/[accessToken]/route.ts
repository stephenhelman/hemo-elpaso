import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string; accessToken: string } },
) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await prisma.patient.findUnique({ where: { auth0Id: session.user.sub } });
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Find assignment by token
  const assignment = await prisma.volunteerEventAssignment.findUnique({
    where: { accessToken: params.accessToken },
    include: {
      volunteerProfile: true,
      event: true,
    },
  });

  if (!assignment) return NextResponse.json({ error: "Invalid access token" }, { status: 404 });
  if (assignment.event.id !== params.id) {
    return NextResponse.json({ error: "Event mismatch" }, { status: 400 });
  }
  if (assignment.volunteerProfile.patientId !== patient.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Check token expiry
  if (assignment.accessTokenExpiresAt && new Date(assignment.accessTokenExpiresAt) < new Date()) {
    return NextResponse.json({ error: "Access token has expired" }, { status: 400 });
  }

  // Check for existing active timecard
  const existing = await prisma.volunteerTimecard.findFirst({
    where: {
      volunteerProfileId: assignment.volunteerProfileId,
      eventId: params.id,
      checkOutTime: null,
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Already checked in", timecardId: existing.id },
      { status: 409 },
    );
  }

  const timecard = await prisma.volunteerTimecard.create({
    data: {
      volunteerProfileId: assignment.volunteerProfileId,
      eventId: params.id,
      status: "active",
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: patient.id,
      action: AuditAction.VOLUNTEER_CHECKED_IN,
      resourceType: "VolunteerTimecard",
      resourceId: timecard.id,
      details: `Volunteer checked in to ${assignment.event.titleEn} via token`,
    },
  });

  return NextResponse.json({ success: true, timecardId: timecard.id });
}
