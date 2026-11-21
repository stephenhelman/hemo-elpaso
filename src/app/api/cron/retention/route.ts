import { NextRequest, NextResponse } from "next/server";
import { clearEndedEventTokens, purgeOldLogs } from "@/lib/retention";

/**
 * Daily retention job (vercel.json). Same protection as the other crons: Bearer CRON_SECRET.
 * Deletes only what the Privacy Policy says: expired event links/QR codes, old email logs, old audit logs.
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
    console.info("retention run", { ...tokens, ...logs });
    return NextResponse.json({ ok: true, tokens, logs });
  } catch {
    console.error("retention: failed");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
