import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/lib/identity/session";
import { isFeatureEnabled } from "@/lib/features";
import { isPortalConsentType, sameOrigin } from "@/lib/portal/rules";
import { recordPortalConsent } from "@/lib/portal/service";

export const dynamic = "force-dynamic";

/**
 * Family page: change one consent. Body { type: "media" | "sms" | "newsletter", granted: boolean }.
 * The household is the SIGNED-IN person's own (from the session, never from the request); a confirmed adult's choice goes on their own row. Needs a linked household
 * (family or board session) and the family_portal toggle ON. Appends a consent record (method "portal").
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req.headers.get("origin"), req.headers.get("host"))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const s = await resolveSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.mode === "none" || !s.hasHousehold || !s.patient) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await isFeatureEnabled("family_portal"))) return NextResponse.json({ error: "unavailable" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || !isPortalConsentType(body.type) || typeof body.granted !== "boolean") return NextResponse.json({ error: "bad_request" }, { status: 400 });

  // The household is the session's; with a member sign-in the choice is that adult's OWN (their row), never another adult's.
  const r = await recordPortalConsent(s.patient.id, body.type, body.granted, s.actor?.kind === "member" ? s.actor.memberId : null);
  return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error }, { status: r.status });
}
