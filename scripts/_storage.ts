/**
 * For the checks that write real files: they use a development bucket or nothing. Returns why their storage part can't
 * run (no settings, or the production bucket), or null. check:all lists the skips at the end.
 */
import { appendFileSync } from "node:fs";
import { readR2Config } from "../src/lib/r2-config";

export function storageSkipReason(check: string): string | null {
  try {
    readR2Config();
    return null;
  } catch (e) {
    const reason = (e as Error).message;
    if (process.env.HOEP_SKIP_FILE) appendFileSync(process.env.HOEP_SKIP_FILE, `${check}: ${reason}\n`);
    return reason;
  }
}
