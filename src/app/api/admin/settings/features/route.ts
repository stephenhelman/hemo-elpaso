import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { actorFor } from "@/lib/email-routing/actor";
import { isFeatureKey } from "@/lib/features/registry";
import { toggleFeature } from "@/lib/features/change";
import { readFlagsFresh, toggleDeps } from "@/lib/features";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requirePermission("canManageFeatureToggles");
  if (error) return error;
  return NextResponse.json({ flags: await readFlagsFresh() });
}

/** Body: { key, enabled }. Enabling a locked feature is refused (409 with the reason). */
export async function PUT(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageFeatureToggles");
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body || !isFeatureKey(body.key) || typeof body.enabled !== "boolean") return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const result = await toggleFeature(toggleDeps(), body.key, body.enabled, await actorFor(admin));
  if (!result.ok) return NextResponse.json(result, { status: 409 });
  return NextResponse.json(result);
}
