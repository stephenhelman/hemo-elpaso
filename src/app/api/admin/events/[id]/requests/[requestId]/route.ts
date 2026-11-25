import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { confirmRequest, declineRequest, waitlistRequest } from "@/lib/rsvp/requests";
import { CONFIRM_BLOCK_TEXT } from "@/lib/rsvp/request-rules";

/**
 * Decide an RSVP request. Body: { action: "confirm_in_person" | "confirm_virtual" | "waitlist" | "decline", reason?: DeclineReason }.
 * Confirming creates the invitation and the RSVP together. Everything is logged with ids, statuses and reason codes only.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string; requestId: string } }) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const r = await prisma.rsvpRequest.findUnique({ where: { id: params.requestId }, select: { eventId: true } });
  if (!r || r.eventId !== params.id) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  try {
    if (body.action === "confirm_in_person" || body.action === "confirm_virtual") {
      const c = await confirmRequest({ requestId: params.requestId, type: body.action === "confirm_virtual" ? "virtual" : "in_person", adminId: admin!.id });
      if (!c.ok) return NextResponse.json({ error: c.code in CONFIRM_BLOCK_TEXT ? CONFIRM_BLOCK_TEXT[c.code as keyof typeof CONFIRM_BLOCK_TEXT] : "Could not confirm", code: c.code }, { status: c.status });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "waitlist") {
      const w = await waitlistRequest({ requestId: params.requestId, adminId: admin!.id });
      return w.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: w.error }, { status: 409 });
    }
    if (body.action === "decline") {
      const d = await declineRequest({ requestId: params.requestId, reason: body.reason, adminId: admin!.id });
      return d.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: d.error }, { status: 400 });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    console.error("rsvp request decision failed");
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
