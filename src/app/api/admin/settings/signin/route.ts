import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getRequireOrgAccount, listOfficers, setRequireOrgAccount } from "@/lib/identity/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requirePermission("canManageSettings");
  if (error) return error;
  return NextResponse.json({ enabled: await getRequireOrgAccount(), officers: await listOfficers() });
}

/** Body: { enabled }. ON is refused (409 officers_missing) until every officer role has an org identity linked. */
export async function PUT(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageSettings");
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.enabled !== "boolean") return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const r = await setRequireOrgAccount(body.enabled, { id: admin!.id, email: admin!.email });
  return r.ok ? NextResponse.json(r) : NextResponse.json(r, { status: 409 });
}
