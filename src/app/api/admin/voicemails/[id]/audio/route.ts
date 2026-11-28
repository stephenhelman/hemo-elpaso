import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { audioResponse } from "@/lib/phone/audio-range";
import { playVoicemail } from "@/lib/phone/voicemail-board";

export const dynamic = "force-dynamic";

/**
 * Play a voicemail: the audio is fetched from the phone provider with our credentials and passed on, with range
 * requests. Private, never cached, no signed or public address. Every play is audited.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canListenVoicemail");
  if (error) return error;
  const result = await playVoicemail(params.id, { actorId: admin.id, playId: req.nextUrl.searchParams.get("play") });
  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : result.error === "failed" ? 502 : 503;
    return NextResponse.json({ error: result.error }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
  return audioResponse(result.audio, req.headers.get("range"));
}
