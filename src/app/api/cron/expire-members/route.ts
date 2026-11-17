import { NextRequest, NextResponse } from "next/server";
import { expirePendingMembers } from "@/lib/households/confirm";

/**
 * Daily: pending household members past their 30-day window have their details
 * purged (same write as a decline, status "expired"). Audit-logged with ids only.
 */
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const expired = await expirePendingMembers();
    return NextResponse.json({ ok: true, expired });
  } catch {
    console.error("expire-members: failed");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
