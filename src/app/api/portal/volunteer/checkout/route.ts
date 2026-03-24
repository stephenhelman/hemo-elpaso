import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await prisma.patient.findUnique({ where: { auth0Id: session.user.sub } });
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { timecardId } = await req.json();
  if (!timecardId) return NextResponse.json({ error: "timecardId required" }, { status: 400 });

  const timecard = await prisma.volunteerTimecard.findUnique({
    where: { id: timecardId },
    include: { volunteerProfile: true },
  });
  if (!timecard || timecard.volunteerProfile.patientId !== patient.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (timecard.checkOutTime) {
    return NextResponse.json({ error: "Already checked out" }, { status: 400 });
  }

  const checkOutTime = new Date();
  const totalMs = checkOutTime.getTime() - timecard.checkInTime.getTime();
  const totalHours = parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2));

  await prisma.volunteerTimecard.update({
    where: { id: timecardId },
    data: { checkOutTime, totalHours, status: "completed" },
  });

  await prisma.auditLog.create({
    data: {
      patientId: patient.id,
      action: AuditAction.VOLUNTEER_CHECKED_OUT,
      resourceType: "VolunteerTimecard",
      resourceId: timecardId,
      details: `Volunteer checked out after ${totalHours} hours`,
    },
  });

  return NextResponse.json({ success: true, totalHours });
}
