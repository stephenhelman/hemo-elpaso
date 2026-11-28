import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { revealCaller } from "@/lib/phone/voicemail-board";

export const dynamic = "force-dynamic";

/** Show one caller's full number (President and Vice President). A POST, so nothing prefetches it; every view is audited. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canListenVoicemail");
  if (error) return error;
  const result = await revealCaller(params.id, admin.id);
  const headers = { "Cache-Control": "private, no-store" };
  return result.ok ? NextResponse.json({ number: result.number }, { headers }) : NextResponse.json({ error: result.error }, { status: 404, headers });
}
