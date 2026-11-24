import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { dismissDuplicate } from "@/lib/identity/duplicates";

/** "Not a duplicate". POST { aId, bId } (any order). President/VP only. The pair is remembered and not offered again. */
export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  if (typeof body.aId !== "string" || typeof body.bId !== "string") return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const ok = await dismissDuplicate(admin!.id, body.aId, body.bId);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}
