/**
 * Email routing: runtime reads (cached by tag) and the DB-backed deps for changing a route.
 * Rules and validation live in ./definitions and ./change (pure, tested).
 *
 * Reads are cached with unstable_cache under ROUTES_TAG (the same tag-revalidation pattern as the Sanity fetches),
 * and saving a route calls revalidateTag, so a change takes effect on every instance immediately. If the table is
 * empty, a row is missing, or the read throws, the code defaults are used and email never stops. A failed read is
 * NOT cached (the throw happens inside the cached function and is caught outside it).
 */
import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { emailDomain } from "@/lib/site";
import { AuditAction } from "@prisma/client";
import { defaultRecipients, resolveRecipients, type RouteKey } from "./definitions";
import type { ChangeDeps, ChangeRecord } from "./change";

export const ROUTES_TAG = "email-routes";

const readAllStored = unstable_cache(
  async (): Promise<Record<string, string[]>> => {
    const rows = await prisma.emailRoute.findMany({ select: { route: true, recipients: true } });
    return Object.fromEntries(rows.map((r) => [r.route, r.recipients]));
  },
  ["email-routes-all"],
  { tags: [ROUTES_TAG], revalidate: 86400 }, // tag invalidation is the real refresh; the TTL is a safety net
);

/** Effective recipients for a route. Never throws; falls back to the code defaults. */
export async function getRouteRecipients(key: RouteKey): Promise<string[]> {
  const domain = emailDomain();
  try {
    const all = await readAllStored();
    return resolveRecipients(key, all[key], domain);
  } catch (e) {
    console.error("email route read failed, using defaults", { route: key, error: e instanceof Error ? e.name : "unknown" });
    return defaultRecipients(key, domain);
  }
}

/** The address printed in the legal pages (route "privacy"). */
export async function getPrivacyEmail(): Promise<string> {
  return (await getRouteRecipients("privacy"))[0];
}

/** Uncached read of the stored rows for the admin editor. Throws on DB errors (the page shows defaults + an error). */
export async function readStoredFresh(key: RouteKey): Promise<string[] | null> {
  const row = await prisma.emailRoute.findUnique({ where: { route: key }, select: { recipients: true } });
  return row?.recipients ?? null;
}

export const invalidateRoutes = () => revalidateTag(ROUTES_TAG);

/** Row + audit entry in one transaction, so there is never a change without its audit record. */
export async function persistChange(rec: ChangeRecord): Promise<void> {
  await prisma.$transaction([
    prisma.emailRoute.upsert({
      where: { route: rec.route },
      create: { route: rec.route, recipients: rec.newValue, updatedBy: rec.actor.id },
      update: { recipients: rec.newValue, updatedBy: rec.actor.id },
    }),
    prisma.auditLog.create({
      data: {
        patientId: rec.actor.id,
        action: AuditAction.EMAIL_ROUTE_CHANGED,
        resourceType: "EmailRoute",
        resourceId: rec.route,
        details: rec.details,
        changes: { route: rec.route, old: rec.oldValue, new: rec.newValue, changedBy: rec.actor.name },
      },
    }),
  ]);
}

/** Attempts by this user in the last minute (counted from the audit log, so it holds across serverless instances). */
export async function recentTestCount(userId: string): Promise<number> {
  return prisma.auditLog.count({
    where: { patientId: userId, action: AuditAction.EMAIL_ROUTE_TEST_SENT, createdAt: { gte: new Date(Date.now() - 60_000) } },
  });
}

export type { ChangeDeps };
