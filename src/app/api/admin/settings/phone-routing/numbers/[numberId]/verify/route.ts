import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { actorFor } from "@/lib/email-routing/actor";
import { startVerification } from "@/lib/phone/service";
import { respond } from "@/lib/phone/respond";

export const dynamic = "force-dynamic";

/** Ring the number and show the admin the code its owner must type. Limited per number per hour. */
export async function POST(_req: NextRequest, { params }: { params: { numberId: string } }) {
  const { admin, error } = await requirePermission("canManagePhoneRouting");
  if (error) return error;
  return respond(await startVerification(await actorFor(admin), params.numberId));
}
