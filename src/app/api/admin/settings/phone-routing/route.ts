import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission, requirePermission } from "@/lib/permissions";
import { actorFor } from "@/lib/email-routing/actor";
import { phoneView } from "@/lib/phone/view";
import { addDutyNumber } from "@/lib/phone/service";
import { respond } from "@/lib/phone/respond";

export const dynamic = "force-dynamic";

/** Current routing, numbers masked. */
export async function GET() {
  const { admin, error } = await requireAnyPermission(["canManagePhoneRouting", "canSwapPhoneDuty"]);
  if (error) return error;
  return NextResponse.json(await phoneView(admin.can("canManagePhoneRouting")), { headers: { "Cache-Control": "no-store" } });
}

/** Add a duty number. Body: { ownerId, number }. It can't be rung until it is verified. */
export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canManagePhoneRouting");
  if (error) return error;
  const body = await req.json().catch(() => null);
  return respond(await addDutyNumber(await actorFor(admin), body?.ownerId, body?.number));
}
