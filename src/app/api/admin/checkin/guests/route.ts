import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { noPhotosFlag } from "@/lib/checkin";

/** Guest list: this event's ACTIVE RSVPs, searchable by name or phone. */
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
    include: { patient: { include: { contactProfile: true, consentRecords: true } } },
    orderBy: { rsvpDate: "asc" },
    // the NO PHOTOS rule is evaluated in code (latest record wins), so the filtered list is not cut off at 60
    take: noPhotosOnly ? 500 : 60,
  });
  const rsvps = noPhotosOnly ? all.filter((r) => noPhotosFlag(r.patient.consentRecords)) : all;
  const checkIns = await prisma.checkIn.findMany({
    where: { eventId, patientId: { in: rsvps.map((r) => r.patientId) } },
    select: { id: true, patientId: true, headcount: true },
  });
  const ci = new Map(checkIns.map((c) => [c.patientId, c]));

  return NextResponse.json({
    guests: rsvps.map((r) => ({
      rsvpId: r.id,
      name: `${r.patient.contactProfile?.firstName ?? ""} ${r.patient.contactProfile?.lastName ?? ""}`.trim(),
      phone: r.patient.contactProfile?.phone ?? null,
      partySize: r.attendeeCount,
      noPhotos: noPhotosFlag(r.patient.consentRecords),
      checkInId: ci.get(r.patientId)?.id ?? null,
      headcount: ci.get(r.patientId)?.headcount ?? null,
    })),
  });
}
