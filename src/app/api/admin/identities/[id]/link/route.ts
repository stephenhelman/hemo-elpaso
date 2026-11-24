import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { linkIdentity } from "@/lib/identity/admin";

/** President/VP (canManageUsers): link an unmatched sign-in to a person. Body: { patientId }. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.patientId !== "string") return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const r = await linkIdentity(params.id, body.patientId, { id: admin!.id });
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: r.status });
}
