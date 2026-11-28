import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { logFlyerFailure } from "@/lib/flyers/log";
import { CLIENT_REPORT_LIMIT, CLIENT_REPORT_MAX_BYTES, parseClientReport, readCapped } from "@/lib/flyers/client-report";
import { takeRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ID = /^[A-Za-z0-9-]{1,64}$/;

/**
 * Failures only the browser sees (the direct upload to storage, or a request refused before it reached the app), put
 * into the server log. Needs a signed-in board member who manages events, takes at most 1 KB and 20 reports per ten
 * minutes per person, and logs codes only (lib/flyers/client-report.ts): never text or file contents from the browser.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const eventId = ID.test(params.id) ? params.id : "invalid";
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) {
      logFlyerFailure("auth", { eventId, httpStatus: error.status }, "permission refused");
      return error;
    }
    if (!(await takeRateLimit(`flyer-client-error.${admin.id}`, CLIENT_REPORT_LIMIT))) {
      return NextResponse.json({ error: "Too many reports" }, { status: 429 });
    }
    const text = await readCapped(request, CLIENT_REPORT_MAX_BYTES);
    if (text === null) return NextResponse.json({ error: "Report too large" }, { status: 413 });
    let body: unknown = null;
    try { body = JSON.parse(text); } catch { /* an unreadable report is logged as "unknown": the parse error would quote it */ }

    const r = parseClientReport(body);
    logFlyerFailure(r.step, { eventId, lang: r.lang, httpStatus: r.httpStatus, reportedBy: "browser" }, r.storageCode ? `${r.code} (${r.storageCode})` : r.code);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logFlyerFailure("upload", { eventId, reportedBy: "browser" }, error);
    return NextResponse.json({ error: "Could not record the error" }, { status: 500 });
  }
}
