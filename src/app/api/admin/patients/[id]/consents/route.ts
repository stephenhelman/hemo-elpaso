import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { recordBoardConsent } from "@/lib/consent/board";

/**
 * President/VP (canManageUsers): record a consent change for a household or one confirmed adult member.
 * POST { type, granted, reason, memberId? }. Appends a record (method "board"); never updates.
 * Turning ON needs a FAMILY_ASKED_* reason; withdrawing is always allowed. Rules: lib/consent/board-rules.ts.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.granted !== "boolean") return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const r = await recordBoardConsent(admin!.id, params.id, { memberId: typeof body.memberId === "string" ? body.memberId : null, type: body.type, granted: body.granted, reason: body.reason });
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: r.status });
}
