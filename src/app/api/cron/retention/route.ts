import { NextRequest, NextResponse } from "next/server";
import { clearEndedEventTokens, purgeMergedTombstones, purgeOldLogs } from "@/lib/retention";
import { purgeUnmatchedIdentities } from "@/lib/identity/admin";

// Reads request headers and the database: never prerender at build time.
export const dynamic = "force-dynamic";

/**
 * Daily retention job (vercel.json). Same protection as the other crons: Bearer CRON_SECRET.
 * Deletes only what the Privacy Policy says: expired event links/QR codes, old email logs, old audit logs, unmatched sign-in records after 30 days, merge tombstones after 12 months.
 * It NEVER deletes households: those are listed on /admin/inactive-households for the President/VP.
 * Logs counts only.
 */
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const tokens = await clearEndedEventTokens();
    const logs = await purgeOldLogs();
    const signIns = await purgeUnmatchedIdentities(); // sign-ins that never matched a household: 30 days
    const merged = await purgeMergedTombstones(); // merge tombstones: 12 months
    console.info("retention run", { ...tokens, ...logs, ...signIns, ...merged });
    return NextResponse.json({ ok: true, tokens, logs, signIns, merged });
  } catch {
    console.error("retention: failed");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
