import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/lib/identity/session";
import { rsvpYes } from "@/lib/rsvp";

/**
 * RSVP from the event page or the family page by a SIGNED-IN household. The household comes from the session, never from
 * the body. The review gate (approved household, invitation where the event requires one) is enforced inside rsvpYes.
 * Body: { eventId, selection: { primary, memberIds, guests } }.
 */
export async function POST(req: NextRequest) {
  const s = await resolveSession();
  if (!s?.patient || !s.actor || s.mode === "none") return NextResponse.json({ ok: false, error: "signed_out" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.eventId !== "string") return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const r = await rsvpYes({ eventId: body.eventId, patientId: s.patient.id, selection: body.selection, source: "portal" });
  if (!r.ok) {
    const error = r.code === "AT_CAPACITY" ? "full" : r.code === "DEADLINE_PASSED" ? "closed" : r.code === "NOT_APPROVED" ? "review" : r.code === "NOT_INVITED" ? "invitation" : r.code === "ENDED" ? "ended" : "invalid";
    return NextResponse.json({ ok: false, error }, { status: r.status === 404 ? 404 : r.status });
  }
  return NextResponse.json({ ok: true, created: r.created, checkInToken: r.token });
}
