import { NextResponse } from "next/server";
import { R2ConfigError, r2Config } from "@/lib/r2-config";

/**
 * First thing a route that needs file storage does after its permission check: null when storage is usable, otherwise
 * the 503 to return. So a missing (or refused) setting breaks these routes only, with the reason in the server log
 * (variable names, never values).
 */
export function storageUnavailable(area: string): NextResponse | null {
  try {
    r2Config();
    return null;
  } catch (e) {
    if (!(e instanceof R2ConfigError)) throw e;
    console.error("[r2] storage unavailable", { area, reason: e.message });
    return NextResponse.json({ error: "File storage is not available. The server log says which storage setting is wrong." }, { status: 503 });
  }
}
