import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { unlinkIdentity } from "@/lib/identity/admin";

/** President/VP (canManageUsers): unlink a sign-in from a person (never the admin account's). */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;
  const r = await unlinkIdentity(params.id, { id: admin!.id });
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: r.status });
}
