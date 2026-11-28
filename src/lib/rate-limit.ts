/**
 * A small shared rate limit: one counter row per key in app_settings, so it holds across serverless instances. The
 * increment is a single statement, so parallel requests can't slip past. For signed-in, low-volume actions.
 */
import { prisma } from "@/lib/db";

export const RATE_LIMIT_PREFIX = "ratelimit.";

/** Count this attempt. False when the key has had more than `max` attempts in the current window. */
export async function takeRateLimit(name: string, limit: { max: number; windowMs: number }, now = Date.now()): Promise<boolean> {
  const key = `${RATE_LIMIT_PREFIX}${name}`;
  const windowOpenedAfter = now - limit.windowMs;
  const rows = await prisma.$queryRaw<{ n: number }[]>`
    INSERT INTO app_settings ("key", "value", "updatedAt")
    VALUES (${key}, jsonb_build_object('start', ${now}::bigint, 'n', 1), now())
    ON CONFLICT ("key") DO UPDATE SET
      "value" = CASE
        WHEN (app_settings."value"->>'start')::bigint > ${windowOpenedAfter}::bigint
          THEN jsonb_set(app_settings."value", '{n}', to_jsonb((app_settings."value"->>'n')::int + 1))
        ELSE jsonb_build_object('start', ${now}::bigint, 'n', 1)
      END,
      "updatedAt" = now()
    RETURNING ("value"->>'n')::int AS n`;
  return rows[0].n <= limit.max;
}
