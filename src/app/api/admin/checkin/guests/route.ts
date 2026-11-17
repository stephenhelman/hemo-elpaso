import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { ATTENDEE_WITH_MEMBER, mapPeople } from "@/lib/rsvp/people";

/** Guest list: this event's ACTIVE RSVPs with their people, searchable by name or phone. */
export async function GET(req: NextRequest) {
  const { error } = await requirePermission("canManageEvents");
  if (error) return error;

  const sp = new URL(req.url).searchParams;
  const eventId = sp.get("eventId");
  const q = (sp.get("q") ?? "").trim();
  const noPhotosOnly = sp.get("noPhotos") === "1";
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });
  const digits = q.replace(/\D/g, "");

  const all = await prisma.rsvp.findMany({
    where: {
      eventId,
      cancelledAt: null,
      ...(q
        ? {
            patient: {
              OR: [
                { contactProfile: { firstName: { contains: q, mode: "insensitive" } } },
                { contactProfile: { lastName: { contains: q, mode: "insensitive" } } },
                ...(digits.length >= 3 ? [{ contactProfile: { phone: { contains: digits } } }] : []),
              ],
            },
          }
        : {}),
    },
    include: {
      patient: { select: { contactProfile: true, consentRecords: { where: { type: "media" }, orderBy: { createdAt: "desc" }, take: 1, select: { granted: true } } } },
      attendees: { include: ATTENDEE_WITH_MEMBER, orderBy: { createdAt: "asc" } },
    },
    orderBy: { rsvpDate: "asc" },
    // the NO PHOTOS rule is evaluated in code, so the filtered list is not cut off at 60
    take: noPhotosOnly ? 500 : 60,
  });
  const checkIns = await prisma.checkIn.findMany({
    where: { eventId, patientId: { in: all.map((r) => r.patientId) } },
    select: { id: true, patientId: true, headcount: true, guestsCheckedIn: true },
  });
  const ci = new Map(checkIns.map((c) => [c.patientId, c]));

  const guests = all.map((r) => {
    const people = mapPeople(r.attendees, r.patient.contactProfile?.firstName ?? "", r.patient.consentRecords[0]?.granted);
    const c = ci.get(r.patientId);
    return {
      rsvpId: r.id,
      name: `${r.patient.contactProfile?.firstName ?? ""} ${r.patient.contactProfile?.lastName ?? ""}`.trim(),
      phone: r.patient.contactProfile?.phone ?? null,
      partySize: r.attendeeCount,
      people,
      guestCount: r.guestCount,
      guestsCheckedIn: c?.guestsCheckedIn ?? 0,
      noPhotos: people.some((p) => p.noPhotos),
      checkInId: c?.id ?? null,
      headcount: c?.headcount ?? null,
    };
  });
  return NextResponse.json({ guests: noPhotosOnly ? guests.filter((g) => g.noPhotos) : guests });
}
