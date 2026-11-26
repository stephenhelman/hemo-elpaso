import { NextRequest } from "next/server";
import { requireAnyPermission } from "@/lib/permissions";
import { actorFor } from "@/lib/email-routing/actor";
import { changeDuty } from "@/lib/phone/service";
import { respond } from "@/lib/phone/respond";

export const dynamic = "force-dynamic";

/**
 * Who answers an option. Body: { option, numberId }. admin@ may also leave an option empty (numberId null); the President
 * and Vice President may only move it to another verified board member's number. Audited; all four officers are emailed.
 */
export async function PUT(req: NextRequest) {
  const { admin, error } = await requireAnyPermission(["canManagePhoneRouting", "canSwapPhoneDuty"]);
  if (error) return error;
  const body = await req.json().catch(() => null);
  const as = admin.can("canManagePhoneRouting") ? "manage" : "swap";
  return respond(await changeDuty(await actorFor(admin), body?.option, body?.numberId, as));
}
