import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";

/** Check-ins for the console's "checked in" list (names + headcount only). */
export async function GET(_req: NextRequest, { params }: { params: { eventId: string } }) {
  const { error } = await requirePermission("canManageEvents");
  if (error) return error;

  const rows = await prisma.checkIn.findMany({
    where: { eventId: params.eventId },
    include: { patient: { include: { contactProfile: true } } },
    orderBy: { checkInTime: "desc" },
  });
  const rsvps = await prisma.rsvp.findMany({
    where: { eventId: params.eventId, cancelledAt: null },
    select: { patientId: true, attendeeCount: true },
  });
  const party = new Map(rsvps.map((r) => [r.patientId, r.attendeeCount]));

  const checkIns = rows.map((c) => ({
    id: c.id,
    name: `${c.patient.contactProfile?.firstName ?? ""} ${c.patient.contactProfile?.lastName ?? ""}`.trim(),
    headcount: c.headcount ?? party.get(c.patientId) ?? 1,
    partySize: party.get(c.patientId) ?? null,
    checkInTime: c.checkInTime,
  }));
  return NextResponse.json({
    checkIns,
    totals: {
      rsvpParties: rsvps.length,
      rsvpPeople: rsvps.reduce((n, r) => n + r.attendeeCount, 0),
      checkedInParties: checkIns.length,
      checkedInPeople: checkIns.reduce((n, c) => n + c.headcount, 0),
    },
  });
}
