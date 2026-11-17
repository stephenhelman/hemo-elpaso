import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { selectableMembers } from "@/lib/rsvp";

/**
 * People who can be listed on this patient's RSVP, plus the current selection
 * (existing active RSVP for ?eventId=, else everyone). Names, relationship and
 * age group only: never diagnoses.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission("canManageEvents");
  if (error) return error;

  const p = await prisma.patient.findFirst({
    where: { id: params.id, ...PATIENT_ONLY },
    select: { id: true, contactProfile: { select: { firstName: true } } },
  });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const eventId = new URL(req.url).searchParams.get("eventId");
  const members = await selectableMembers(p.id);
  const rsvp = eventId
    ? await prisma.rsvp.findFirst({
        where: { eventId, patientId: p.id, cancelledAt: null },
        include: { attendees: { select: { isPrimary: true, householdMemberId: true } } },
      })
    : null;

  return NextResponse.json({
    primaryName: p.contactProfile?.firstName ?? "",
    options: members.map((m) => ({ id: m.id, label: m.firstName ?? "", relationship: m.relationship, ageGroup: m.ageGroup, status: m.status })),
    selected: rsvp
      ? { primary: rsvp.attendees.some((a) => a.isPrimary), memberIds: rsvp.attendees.map((a) => a.householdMemberId).filter(Boolean), guests: rsvp.guestCount }
      : { primary: true, memberIds: members.map((m) => m.id), guests: 0 },
  });
}
