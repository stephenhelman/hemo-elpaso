import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/lib/identity/session";
import { rsvpOrRequest } from "@/lib/rsvp/requests";
import { submitResponse } from "@/lib/rsvp/response";

/**
 * "RSVP now" from the event modal or the family page by a SIGNED-IN household (the household comes from the session, never the body).
 * Invited and approved: RSVP right away. Anyone else: a request to attend (waiting on household review until approved).
 * Body: { eventId, selection: { primary, memberIds, guests }, source?: "modal" | "portal" }.
 */
export async function POST(req: NextRequest) {
  const s = await resolveSession();
  if (!s?.patient || !s.actor || s.mode === "none" || !s.hasHousehold) return NextResponse.json({ ok: false, error: "signed_out" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.eventId !== "string") return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  try {
    const r = await rsvpOrRequest({ eventId: body.eventId, patientId: s.patient.id, source: body.source === "portal" ? "portal" : "modal", selection: body.selection });
    return submitResponse(r);
  } catch {
    console.error("rsvp request failed");
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
