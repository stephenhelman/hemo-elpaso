import { NextRequest, NextResponse } from "next/server";
import { portalContext } from "@/lib/portal/request";
import { confirmEmailChange } from "@/lib/portal/edit";

export const dynamic = "force-dynamic";

/**
 * The "Confirm" button on the page the emailed link opens. Same origin, signed in, and the SAME person who asked for the
 * change (a forwarded link does nothing). Body { token }. The answer never says why a link failed.
 */
export async function POST(req: NextRequest) {
  const g = await portalContext(req);
  if (g.error) return g.error;
  const body = await req.json().catch(() => null);
  const r = await confirmEmailChange(body?.token, g.ctx);
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "invalid_or_expired" }, { status: 404 });
}
