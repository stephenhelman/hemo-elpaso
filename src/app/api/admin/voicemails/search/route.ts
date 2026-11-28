import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { findByCaller } from "@/lib/phone/voicemail-board";

export const dynamic = "force-dynamic";

/** Find one caller's messages. Body: { number } (a POST, so the number is never in an address or a log). */
export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canListenVoicemail");
  if (error) return error;
  const body = await req.json().catch(() => null);
  const result = await findByCaller(body?.number, admin.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "invalid" ? 400 : 503 });
  return NextResponse.json({ ids: result.ids }, { headers: { "Cache-Control": "private, no-store" } });
}
