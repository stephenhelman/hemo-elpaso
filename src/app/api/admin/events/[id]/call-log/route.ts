import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { logCall } from "@/lib/rsvp/call-list";

/** The call list's "called" button. Body: { patientId, purpose: "invitation" | "confirmation", outcome: REACHED | VOICEMAIL | NO_ANSWER | WRONG_NUMBER | CALLBACK_NEEDED }. No free-text notes. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  if (typeof body.patientId !== "string") return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const r = await logCall({ eventId: params.id, patientId: body.patientId, purpose: body.purpose, outcome: body.outcome, adminId: admin!.id });
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 });
}
