import { NextRequest, NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { emailDomain } from "@/lib/site";
import { isRouteKey } from "@/lib/email-routing/definitions";
import { testRateLimited, testRecipients } from "@/lib/email-routing/change";
import { readStoredFresh, recentTestCount } from "@/lib/email-routing";
import { sendRouteTest } from "@/lib/email-routing/notify";
import { actorFor } from "@/lib/email-routing/actor";

export const dynamic = "force-dynamic";

/** Send a test through one route. Body: { route }. It goes ONLY to that route's configured recipients; 5 per user per minute. */
export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageEmailRouting");
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body || !isRouteKey(body.route)) return NextResponse.json({ error: "unknown_route" }, { status: 400 });

  if (testRateLimited(await recentTestCount(admin.id))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const actor = await actorFor(admin);
  const to = await testRecipients({ domain: emailDomain(), readStored: readStoredFresh }, body.route);

  // Logged before sending, so failed attempts count toward the limit too.
  await prisma.auditLog.create({
    data: {
      patientId: admin.id,
      action: AuditAction.EMAIL_ROUTE_TEST_SENT,
      resourceType: "EmailRoute",
      resourceId: body.route,
      details: `Test email for route ${body.route} sent to ${to.join(", ")} by ${actor.name}`,
    },
  });

  const res = await sendRouteTest(body.route, to, actor.name);
  if (!res.ok) return NextResponse.json({ error: "send_failed", detail: res.errorName }, { status: 502 });
  return NextResponse.json({ success: true, to });
}
