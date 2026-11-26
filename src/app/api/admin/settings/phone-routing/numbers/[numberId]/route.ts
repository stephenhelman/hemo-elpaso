import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { actorFor } from "@/lib/email-routing/actor";
import { removeDutyNumber } from "@/lib/phone/service";
import { respond } from "@/lib/phone/respond";

export const dynamic = "force-dynamic";

/** Remove a duty number. Any option that used it is left unassigned. */
export async function DELETE(_req: NextRequest, { params }: { params: { numberId: string } }) {
  const { admin, error } = await requirePermission("canManagePhoneRouting");
  if (error) return error;
  return respond(await removeDutyNumber(await actorFor(admin), params.numberId));
}
