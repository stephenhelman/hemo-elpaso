import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { setBoardOrgEmail } from "@/lib/identity/admin";

/** Admin (settings-only): set the org email on a board record. Records with household data are refused. */
export async function PATCH(req: NextRequest, { params }: { params: { patientId: string } }) {
  const { admin, error } = await requirePermission("canAssignBoardRoles");
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.email !== "string") return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const r = await setBoardOrgEmail(params.patientId, body.email, { id: admin!.id });
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: r.status });
}
