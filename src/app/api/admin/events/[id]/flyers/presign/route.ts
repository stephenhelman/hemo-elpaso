import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { presignFlyers } from "@/lib/flyers/upload";
import { logFlyerFailure } from "@/lib/flyers/log";
import { storageUnavailable } from "@/lib/storage-response";

export const dynamic = "force-dynamic";

/**
 * Step 1 of saving a flyer: short-lived presigned PUT URLs into the private uploads/tmp/ area. The browser sends each
 * file straight to storage, then calls ../ to confirm and save it.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requirePermission("canManageEvents");
    if (error) {
      logFlyerFailure("auth", { eventId: params.id, httpStatus: error.status }, "permission refused");
      return error;
    }
    const down = storageUnavailable("flyer upload");
    if (down) return down;
    const result = await presignFlyers(params.id, await request.json().catch(() => null));
    if (!result.ok) return NextResponse.json({ error: result.error, step: result.step }, { status: result.status });
    return NextResponse.json({ success: true, uploads: result.uploads });
  } catch (error) {
    logFlyerFailure("presign", { eventId: params.id, httpStatus: 500 }, error);
    return NextResponse.json({ error: "Could not prepare the upload.", step: "presign" }, { status: 500 });
  }
}
