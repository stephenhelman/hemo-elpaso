import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { isFlyerStep, logFlyerFailure, safeLogText } from "@/lib/flyers/log";

export const dynamic = "force-dynamic";

/**
 * Failures only the browser sees (the direct upload to storage, or a request refused before it reached the app), put
 * into the server log. Writes nothing else.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requirePermission("canManageEvents");
    if (error) {
      logFlyerFailure("auth", { eventId: params.id, httpStatus: error.status }, "permission refused");
      return error;
    }
    const body = await request.json().catch(() => null);
    logFlyerFailure(
      isFlyerStep(body?.step) ? body.step : "upload",
      {
        eventId: params.id,
        lang: body?.lang === "en" || body?.lang === "es" ? body.lang : undefined,
        httpStatus: Number.isInteger(body?.httpStatus) ? body.httpStatus : undefined,
        reportedBy: "browser",
      },
      safeLogText(typeof body?.message === "string" ? body.message : "no detail"),
    );
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logFlyerFailure("upload", { eventId: params.id, reportedBy: "browser" }, error);
    return NextResponse.json({ error: "Could not record the error" }, { status: 500 });
  }
}
