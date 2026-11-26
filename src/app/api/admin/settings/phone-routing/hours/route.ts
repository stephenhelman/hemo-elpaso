import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { actorFor } from "@/lib/email-routing/actor";
import { changeHours } from "@/lib/phone/service";
import { respond } from "@/lib/phone/respond";

export const dynamic = "force-dynamic";

/** Answering hours of an option, El Paso time. Body: { option, hours: null | { days, start, end } }. */
export async function PUT(req: NextRequest) {
  const { admin, error } = await requirePermission("canManagePhoneRouting");
  if (error) return error;
  const body = await req.json().catch(() => null);
  // a missing "hours" is a mistake, not "any time": only an explicit null clears them
  return respond(await changeHours(await actorFor(admin), body?.option, body && "hours" in body ? body.hours : undefined));
}
