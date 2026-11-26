import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { AuditAction } from "@prisma/client";
import { finalizeFlyers } from "@/lib/flyers/upload";
import { logFlyerFailure } from "@/lib/flyers/log";

export const dynamic = "force-dynamic";

/**
 * Step 3 of saving a flyer (see lib/flyers/upload.ts): confirm the uploaded object(s), put them in place, then write
 * the event row. Also saves alt text on its own. The body is JSON: files go straight to storage, never through here.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) {
      logFlyerFailure("auth", { eventId: params.id, httpStatus: error.status }, "permission refused");
      return error;
    }

    const result = await finalizeFlyers(params.id, await request.json().catch(() => null));
    if (!result.ok) return NextResponse.json({ error: result.error, step: result.step }, { status: result.status });

    const { ok, changed, ...saved } = result;
    // The flyer is saved by now: an audit failure is logged, not reported as a failed save.
    await prisma.auditLog
      .create({
        data: {
          patientId: admin.id,
          action: AuditAction.EVENT_FLYERS_UPDATED,
          resourceType: "Event",
          resourceId: params.id,
          details: `Updated event flyers (fields: ${changed.join(", ") || "none"})`,
        },
      })
      .catch((e) => logFlyerFailure("audit", { eventId: params.id }, e));

    return NextResponse.json({ success: true, ...saved });
  } catch (error) {
    logFlyerFailure("finalize", { eventId: params.id, httpStatus: 500 }, error);
    return NextResponse.json({ error: "Saving the flyer failed on the server.", step: "finalize" }, { status: 500 });
  }
}
