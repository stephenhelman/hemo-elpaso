import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { emailDomain } from "@/lib/site";
import { isRouteKey, ROUTE_KEYS, resolveRecipients } from "@/lib/email-routing/definitions";
import { changeRoute } from "@/lib/email-routing/change";
import { invalidateRoutes, persistChange, readStoredFresh } from "@/lib/email-routing";
import { notifyOfficers } from "@/lib/email-routing/notify";
import { actorFor } from "@/lib/email-routing/actor";

export const dynamic = "force-dynamic";

/** Current effective value of every route. */
export async function GET() {
  const { admin, error } = await requirePermission("canManageEmailRouting");
  if (error) return error;
  void admin;
  const domain = emailDomain();
  const routes: Record<string, string[]> = {};
  for (const k of ROUTE_KEYS) routes[k] = resolveRecipients(k, await readStoredFresh(k), domain);
  return NextResponse.json({ domain, routes });
}

/** Change one route. Body: { route, recipients: string[] }. */
export async function PUT(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageEmailRouting");
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body || !isRouteKey(body.route)) return NextResponse.json({ error: "unknown_route" }, { status: 400 });

  const result = await changeRoute(
    { domain: emailDomain(), readStored: readStoredFresh, persist: persistChange, invalidate: invalidateRoutes, notifyOfficers },
    body.route,
    body.recipients,
    await actorFor(admin),
  );
  if (!result.ok) return NextResponse.json({ error: result.error, address: result.address }, { status: 400 });
  return NextResponse.json(result);
}
