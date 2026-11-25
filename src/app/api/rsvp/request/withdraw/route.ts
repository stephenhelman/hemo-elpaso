import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/lib/identity/session";
import { withdrawRequest } from "@/lib/rsvp/requests";

/** The family cancels its request to attend (or, once confirmed, its RSVP). The household comes from the session. Body: { requestId }. */
export async function POST(req: NextRequest) {
  const s = await resolveSession();
  if (!s?.patient || !s.actor || s.mode === "none" || !s.hasHousehold) return NextResponse.json({ ok: false, error: "signed_out" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.requestId !== "string") return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  const r = await withdrawRequest({ requestId: body.requestId, patientId: s.patient.id });
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
}
