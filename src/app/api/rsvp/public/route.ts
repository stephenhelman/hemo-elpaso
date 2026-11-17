import { NextRequest, NextResponse } from "next/server";
import { registrationOpen } from "@/lib/registration";
import { prisma } from "@/lib/db";
import { verifyTurnstile } from "@/lib/turnstile";
import { createPatient, validatePatientInput } from "@/lib/patients/create";
import { sendMemberConfirmations } from "@/lib/households/confirmation";
import { MAX_GUESTS, registrationState, rsvpYes } from "@/lib/rsvp";

/**
 * Public RSVP from the event page (events with registrationEnabled).
 * Same fields/rules as /api/register-info plus a party size: honeypot,
 * Turnstile, never updates an existing patient (a match only flags the NEW
 * record via possibleDuplicateOfId), identical {ok:true} either way.
 * Full/closed answers are about the EVENT, not the person, so they don't
 * leak who is registered.
 */
export async function POST(req: NextRequest) {
  // Closed (REGISTRATION_OPEN != "true"): the endpoint doesn't exist as far as callers can tell.
  if (!registrationOpen()) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  if (typeof body.website === "string" && body.website.trim() !== "") return NextResponse.json({ ok: true });
  if (!(await verifyTurnstile(body.turnstileToken)))
    return NextResponse.json({ ok: false, error: "captcha" }, { status: 400 });

  const event = typeof body.eventId === "string"
    ? await prisma.event.findUnique({ where: { id: body.eventId } })
    : null;
  if (!event) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  // Who is coming, by position in the submitted member list (mapped to ids after creation).
  const att = body.attendees as { primary?: unknown; memberIndexes?: unknown; guests?: unknown } | undefined;
  const memberCount = Array.isArray(body.members) ? body.members.length : 0;
  const idx = Array.isArray(att?.memberIndexes) ? (att!.memberIndexes as unknown[]) : [];
  const guests = Number(att?.guests ?? 0);
  const total = (att?.primary === true ? 1 : 0) + new Set(idx).size + guests;
  if (
    !att || !Number.isInteger(guests) || guests < 0 || guests > MAX_GUESTS ||
    !idx.every((i) => Number.isInteger(i) && (i as number) >= 0 && (i as number) < memberCount) ||
    total < 1
  )
    return NextResponse.json({ ok: false, error: "invalid", field: "attendees" }, { status: 400 });

  const v = validatePatientInput({
    firstName: body.firstName, lastName: body.lastName, email: body.email, phone: body.phone,
    address: body.address, language: body.language,
    familySize: body.familySize,
    diagnoses: body.diagnoses,
    members: body.members, attestation: body.attestation,
    consentDataAndContact: body.consentDataAndContact, consentMedia: body.consentMedia,
  });
  if (!v.ok) return NextResponse.json({ ok: false, error: "invalid", field: v.field }, { status: 400 });

  const state = await registrationState(event);
  if (state !== "open") return NextResponse.json({ ok: false, error: state }, { status: 409 });

  try {
    const { id, invites, memberIds } = await createPatient(v.value, { source: "web", method: "web" });
    await sendMemberConfirmations(id, v.value.firstName, v.value.language, invites);
    const r = await rsvpYes({
      eventId: event.id, patientId: id, source: "public",
      selection: { primary: att.primary === true, memberIds: Array.from(new Set(idx as number[])).map((i) => memberIds[i]), guests },
    });
    if (!r.ok) {
      const code = r.code === "AT_CAPACITY" ? "full" : r.code === "DEADLINE_PASSED" || r.code === "ENDED" ? "closed" : "server";
      return NextResponse.json({ ok: false, error: code }, { status: code === "server" ? 500 : 409 });
    }
  } catch {
    console.error("public rsvp: failed to store registration"); // payload has PII/PHI
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
