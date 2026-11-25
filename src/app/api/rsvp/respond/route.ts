import { NextRequest, NextResponse } from "next/server";
import { resolveRsvpToken, rsvpYes, cancelRsvp, declineInvitation, defaultSelection } from "@/lib/rsvp";

/**
 * Self-service RSVP from a personal link (/rsvp/[token]).
 * Body: { token, response: "yes" | "no", selection?: { primary, memberIds, guests } }
 * (no selection = everyone checked, no guests). A later yes through the same link
 * replaces the selection and re-runs the capacity and deadline checks on the new total.
 * Works until the event ends. Unknown tokens get one generic 404.
 * On a NEW yes the raw check-in token is returned once (the page then moves
 * to /rsvp/<checkInToken> to show the QR); it is also emailed.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ctx = await resolveRsvpToken(body.token);
  if (!ctx) return NextResponse.json({ ok: false, error: "invalid_link" }, { status: 404 });
  if (ctx.ended) return NextResponse.json({ ok: false, error: "ended" }, { status: 400 });

  if (body.response === "no") {
    if (ctx.rsvp) {
      const r = await cancelRsvp({ rsvpId: ctx.rsvp.id });
      if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: r.status });
    } else {
      await declineInvitation(ctx.event.id, ctx.patient.id);
    }
    return NextResponse.json({ ok: true, state: "declined" });
  }

  if (body.response !== "yes") return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const r = await rsvpYes({
    eventId: ctx.event.id,
    patientId: ctx.patient.id,
    selection: body.selection ?? (await defaultSelection(ctx.patient.id)),
    source: ctx.rsvp?.source === "public" || ctx.rsvp?.source === "manual" ? (ctx.rsvp.source as "public" | "manual") : ctx.via === "link" ? "link" : "invite",
  });
  if (!r.ok) return NextResponse.json({ ok: false, error: r.code === "AT_CAPACITY" ? "full" : r.code === "DEADLINE_PASSED" ? "closed" : r.code === "NOT_APPROVED" ? "review" : r.code === "NOT_INVITED" ? "invitation" : r.error }, { status: r.status });
  return NextResponse.json({ ok: true, state: "confirmed", checkInToken: r.token });
}
