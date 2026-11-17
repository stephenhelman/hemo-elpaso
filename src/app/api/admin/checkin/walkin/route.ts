import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { createPatient, validatePatientInput } from "@/lib/patients/create";
import { rsvpYes } from "@/lib/rsvp";
import { checkInRsvp, MAX_HEADCOUNT } from "@/lib/checkin";

/**
 * Walk-in: create patient + RSVP (source "manual") + check-in in one step.
 * Consents are recorded with method "phone" (verbal, at the door) by the board
 * user. Capacity and the RSVP deadline are board-overridable at the door.
 * No confirmation email is sent (they're standing in front of you).
 */
export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;

  const b = await req.json().catch(() => ({}));
  const eventId = typeof b.eventId === "string" ? b.eventId : "";
  const headcount = Number(b.headcount);
  if (!eventId || !Number.isInteger(headcount) || headcount < 1 || headcount > MAX_HEADCOUNT)
    return NextResponse.json({ error: "invalid", field: "headcount" }, { status: 400 });

  const v = validatePatientInput({
    firstName: b.firstName, lastName: b.lastName, email: b.email, phone: b.phone,
    address: b.address, language: b.language, familySize: headcount, diagnoses: [],
    consentDataAndContact: b.consentDataAndContact, consentMedia: b.consentMedia,
  }, { requireConsent: true, household: false });
  if (!v.ok) return NextResponse.json({ error: "invalid", field: v.field }, { status: 400 });

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { id: patientId } = await createPatient(v.value, {
    source: "phone", method: "phone", recordedByBoardUserId: admin!.id,
  });
  const r = await rsvpYes({
    eventId, patientId, partySize: headcount, source: "manual",
    actorId: admin!.id, ignoreDeadline: true, ignoreCapacity: true, sendEmail: false,
  });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });

  const ci = await checkInRsvp({
    rsvpId: r.rsvpId, eventId, headcount,
    admin: { id: admin!.id, email: admin!.email }, manual: true,
  });
  if (!ci.ok) return NextResponse.json({ error: ci.error }, { status: ci.status });
  return NextResponse.json({ ok: true, checkInId: ci.checkInId }, { status: 201 });
}
