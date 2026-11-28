/**
 * Is the phone system switched on? The phone_system feature toggle, read fresh on every call (it is a kill switch, so
 * no cache). NEVER throws and never waits long: if it can't be read, the answer is "off", which still answers the phone
 * (lib/phone/ivr.ts switchedOff).
 */
import { LIVE_POLICY_VERSION } from "@/content/legal/meta";
import { prisma } from "@/lib/db";
import { resolveStates, type FlagRow } from "@/lib/features/registry";

/** Twilio gives up on a webhook after 15 seconds; a stuck database must not use them up. */
export const FLAG_TIMEOUT_MS = 4000;

const readFlags = (): Promise<FlagRow[]> => prisma.featureFlag.findMany({ where: { key: "phone_system" }, select: { key: true, enabled: true, enabledAt: true } });

export async function phoneSystemOn(read: () => Promise<FlagRow[]> = readFlags, timeoutMs = FLAG_TIMEOUT_MS): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const rows = await Promise.race([
      read(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("timeout")), timeoutMs); }),
    ]);
    return resolveStates(rows, LIVE_POLICY_VERSION).phone_system.enabled;
  } catch (e) {
    console.error("[phone] the phone_system toggle could not be read: treating it as off", { error: e instanceof Error ? e.name : "unknown" });
    return false;
  } finally {
    clearTimeout(timer);
  }
}
