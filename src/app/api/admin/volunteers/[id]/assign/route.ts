import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";
import { AuditAction } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { admin, error } = await requirePermission("canManageVolunteers");
  if (error) return error;

  const { eventId, role, notes } = await req.json();
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const profile = await prisma.volunteerProfile.findUnique({
    where: { id: params.id },
    include: { patient: { include: { contactProfile: true } } },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (profile.status !== "APPROVED") {
    return NextResponse.json({ error: "Volunteer must be approved first" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Resolve display name — community volunteers may not have a patient account yet
  const volunteerName = profile.patient
    ? `${profile.patient.contactProfile?.firstName ?? ""} ${profile.patient.contactProfile?.lastName ?? ""}`.trim()
    : (profile.contactName ?? "Community Volunteer");
  const volunteerEmail = profile.patient?.email ?? profile.contactEmail;

  const assignment = await prisma.volunteerEventAssignment.create({
    data: {
      volunteerProfileId: params.id,
      eventId,
      role: role || "GENERAL_SUPPORT",
      assignedBy: admin!.email,
      notes: notes || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.VOLUNTEER_ASSIGNED_TO_EVENT,
      resourceType: "VolunteerEventAssignment",
      resourceId: assignment.id,
      details: `Assigned ${volunteerName} to ${event.titleEn}`,
    },
  });

  if (volunteerEmail) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hemo-elpaso.vercel.app";
    const checkinUrl = `${baseUrl}/events/${event.slug}/checkin/${assignment.accessToken}`;
    try {
      await sendEmail({
        templateType: "VOLUNTEER_ASSIGNED",
        recipient: volunteerEmail,
        data: {
          patientName: volunteerName,
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
          role: assignment.role,
          accessToken: assignment.accessToken,
          checkinUrl,
        },
        patientId: profile.patientId ?? undefined,
        eventId,
      });
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ success: true, assignment });
}
