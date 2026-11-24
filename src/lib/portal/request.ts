import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/lib/identity/session";
import { isFeatureEnabled } from "@/lib/features";
import { sameOrigin } from "./rules";
import type { PortalCtx } from "./context";

/**
 * The gate for every family-page write. In order: the request comes from this site's own origin; there is a session linked
 * to a household (family OR board mode, as the page itself allows); the family_portal toggle is ON. The household and the
 * acting person come from the SESSION. Nothing about them is ever read from the request.
 */
export async function portalContext(req: NextRequest): Promise<{ ctx: PortalCtx; error?: undefined } | { ctx?: undefined; error: NextResponse }> {
  if (!sameOrigin(req.headers.get("origin"), req.headers.get("host"))) return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  const s = await resolveSession();
  if (!s) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (s.mode === "none" || !s.hasHousehold || !s.patient || !s.actor) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  if (!(await isFeatureEnabled("family_portal"))) return { error: NextResponse.json({ error: "unavailable" }, { status: 404 }) };
  return { ctx: { householdId: s.patient.id, actor: s.actor } };
}
