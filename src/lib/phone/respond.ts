import { NextResponse } from "next/server";
import type { ServiceResult } from "./service";

/** A routing change as an HTTP answer. Errors are codes; the page words them. */
export function respond(result: ServiceResult<object>) {
  if (result.ok) return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  const status = result.error === "rate_limited" ? 429 : result.error === "call_failed" ? 502 : result.error === "not_configured" ? 503 : 400;
  return NextResponse.json({ error: result.error }, { status });
}
