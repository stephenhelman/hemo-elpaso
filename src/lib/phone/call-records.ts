/**
 * The phone provider keeps a record of every call (numbers, time, length). The Privacy Policy keeps those for 1 year:
 * the daily job deletes older ones there. Counts only in logs.
 */
import { twilioCallRecords, type CallRecordStore } from "@/lib/twilio/client";
import { CALL_RECORD_DAYS } from "./definitions";

export interface CallRecordSummary { deleted: number; failed: number; skipped: "captured" | "not_configured" | null }

export async function purgeCallRecords(now = new Date(), store: CallRecordStore = twilioCallRecords()): Promise<CallRecordSummary> {
  const s: CallRecordSummary = { deleted: 0, failed: 0, skipped: null };
  const cutoff = new Date(now.getTime() - CALL_RECORD_DAYS * 86_400_000);
  const old = await store.listEndedBefore(cutoff);
  if (!old.ok) {
    if (old.error === "captured" || old.error === "not_configured") s.skipped = old.error;
    else s.failed++;
    return s;
  }
  for (const sid of old.sids) {
    const res = await store.remove(sid);
    if (res.ok) s.deleted++;
    else s.failed++;
  }
  return s;
}
