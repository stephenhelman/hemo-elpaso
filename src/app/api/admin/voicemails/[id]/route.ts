import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { deleteVoicemail } from "@/lib/phone/voicemail";
import { setHandled } from "@/lib/phone/voicemail-board";

export const dynamic = "force-dynamic";

/** Mark handled or not. Body: { handled: boolean }. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canListenVoicemail");
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (typeof body?.handled !== "boolean") return NextResponse.json({ error: "invalid" }, { status: 400 });
  const ok = await setHandled(params.id, body.handled, admin.id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "not_found" }, { status: 404 });
}

/** Delete a voicemail now: at the phone provider first, then here. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canListenVoicemail");
  if (error) return error;
  const result = await deleteVoicemail(params.id, { reason: "manual", actorId: admin.id });
  if (result.ok) return NextResponse.json({ ok: true });
  const status = result.error === "not_found" ? 404 : result.error === "failed" ? 502 : 503;
  return NextResponse.json({ error: result.error }, { status });
}
