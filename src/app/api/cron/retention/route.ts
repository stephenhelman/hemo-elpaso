import { NextRequest, NextResponse } from "next/server";
import { clearEndedEventTokens, purgeEmailChangeRequests, purgeMergedTombstones, purgeOldLogs } from "@/lib/retention";
import { purgeUnmatchedIdentities } from "@/lib/identity/admin";
import { runVoicemailRetention } from "@/lib/phone/voicemail";

// Reads request headers and the database: never prerender at build time.
export const dynamic = "force-dynamic";

/**
 * Daily retention job (vercel.json). Same protection as the other crons: Bearer CRON_SECRET.
 * Deletes only what the Privacy Policy says: expired event links/QR codes, old email logs, old audit logs, unmatched sign-in records after 30 days, merge tombstones after 12 months.
 * Voicemail: deleted at the phone provider after 30 days, then marked here; failures are retried the next day and make
 * the run answer 500 so it shows up in the logs.
 * It NEVER deletes households: those are listed on /admin/inactive-households for the President/VP.
 * Logs counts only.
 */
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // each part runs even if the other fails
  const records = await runRecordRetention();
  const voicemail = await runVoicemailRetention().catch((e) => {
    console.error("retention: voicemail failed", { error: e instanceof Error ? e.name : "unknown" });
    return null;
  });
  if (voicemail) console.info("voicemail retention run", voicemail);
  const ok = !!records && !!voicemail && voicemail.failed === 0;
  return NextResponse.json({ ok, ...records, voicemail }, { status: ok ? 200 : 500 });
}

async function runRecordRetention() {
  try {
    const tokens = await clearEndedEventTokens();
    const logs = await purgeOldLogs();
    const signIns = await purgeUnmatchedIdentities(); // sign-ins that never matched a household: 30 days
    const merged = await purgeMergedTombstones(); // merge tombstones: 12 months
    const emailChanges = await purgeEmailChangeRequests(); // used / expired email-change links
    console.info("retention run", { ...tokens, ...logs, ...signIns, ...merged, ...emailChanges });
    return { tokens, logs, signIns, merged, emailChanges };
  } catch {
    console.error("retention: failed");
    return null;
  }
}
