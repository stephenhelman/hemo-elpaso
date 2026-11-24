import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { eventEndsAt } from "@/lib/rsvp/window";

/**
 * Retention schedule (matches the Privacy Policy, "How long we keep it"):
 *   - event links and QR codes: cleared 30 days after the event ends
 *   - email delivery records: 1 year; access (audit) logs: 3 years
 *   - households with no activity for 3 years: LISTED for the board (never deleted automatically)
 * Everything here logs counts only: no names, emails or ids.
 */
export const TOKEN_GRACE_DAYS = 30;
export const EMAIL_LOG_DAYS = 365;
export const AUDIT_LOG_DAYS = 3 * 365;
export const INACTIVE_YEARS = 3;
/** A merged-away record is kept as a tombstone (no personal data) this long, then deleted. */
export const MERGED_TOMBSTONE_DAYS = 365;

const DAY = 864e5;
/** Cleared values keep their column non-null/unique but can never match a real link. */
export const CLEARED_PREFIX = "cleared:";

/** Events whose end is more than `graceDays` ago. endDate when set, else start + 12h (same rule as lib/rsvp/window). */
export async function eventIdsEndedBefore(now: Date, graceDays = TOKEN_GRACE_DAYS): Promise<string[]> {
  const cutoff = new Date(now.getTime() - graceDays * DAY);
  const candidates = await prisma.event.findMany({
    where: { eventDate: { lt: cutoff } },
    select: { id: true, eventDate: true, endDate: true },
  });
  return candidates.filter((e) => eventEndsAt(e) < cutoff).map((e) => e.id);
}

/** Clear RSVP check-in tokens (hash AND the encrypted copy), invitation tokens and check-in session tokens. */
export async function clearEndedEventTokens(now = new Date()) {
  const eventIds = await eventIdsEndedBefore(now);
  if (eventIds.length === 0) return { events: 0, rsvps: 0, invitations: 0, checkIns: 0 };

  const rsvps = await prisma.rsvp.updateMany({
    where: { eventId: { in: eventIds }, OR: [{ checkInTokenHash: { not: null } }, { checkInTokenEnc: { not: null } }] },
    data: { checkInTokenHash: null, checkInTokenEnc: null },
  });

  // tokenHash / sessionToken are required + unique, so "clearing" overwrites them with a unique unusable value.
  const invs = await prisma.invitation.findMany({
    where: { eventId: { in: eventIds }, NOT: { tokenHash: { startsWith: CLEARED_PREFIX } } },
    select: { id: true },
  });
  for (const i of invs) await prisma.invitation.update({ where: { id: i.id }, data: { tokenHash: CLEARED_PREFIX + randomUUID() } });

  const cis = await prisma.checkIn.findMany({
    where: { eventId: { in: eventIds }, NOT: { sessionToken: { startsWith: CLEARED_PREFIX } } },
    select: { id: true },
  });
  for (const c of cis) await prisma.checkIn.update({ where: { id: c.id }, data: { sessionToken: CLEARED_PREFIX + randomUUID() } });

  return { events: eventIds.length, rsvps: rsvps.count, invitations: invs.length, checkIns: cis.length };
}

export async function purgeOldLogs(now = new Date()) {
  const emails = await prisma.emailLog.deleteMany({ where: { sentAt: { lt: new Date(now.getTime() - EMAIL_LOG_DAYS * DAY) } } });
  const audits = await prisma.auditLog.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - AUDIT_LOG_DAYS * DAY) } } });
  return { emailLogs: emails.count, auditLogs: audits.count };
}

/**
 * Delete merge tombstones 12 months after the merge. A tombstone holds no personal data; this removes the last trace
 * (old links to it stop resolving). Its legacy Family row, if any, goes first (that FK has no cascade). Logs a count only.
 */
export async function purgeMergedTombstones(now = new Date()) {
  const cutoff = new Date(now.getTime() - MERGED_TOMBSTONE_DAYS * DAY);
  const due = await prisma.patient.findMany({ where: { role: "merged", mergedAt: { lt: cutoff } }, select: { id: true } });
  if (due.length === 0) return { tombstones: 0 };
  const idList = due.map((d) => d.id);
  await prisma.family.deleteMany({ where: { primaryPatientId: { in: idList } } });
  const res = await prisma.patient.deleteMany({ where: { id: { in: idList }, role: "merged" } });
  await prisma.auditLog.create({ data: { actorType: "system", action: "MERGED_RECORDS_PURGED", resourceType: "Patient", details: "Merge tombstones purged", changes: { count: res.count } } });
  return { tombstones: res.count };
}

/**
 * Email-change requests hold the NEW address the person typed (the token is only a hash). Used or expired requests are
 * deleted by the daily job, one day after they stop being usable. Counts only.
 */
export async function purgeEmailChangeRequests(now = new Date()) {
  const cutoff = new Date(now.getTime() - DAY);
  const res = await prisma.emailChangeRequest.deleteMany({ where: { OR: [{ expiresAt: { lt: cutoff } }, { usedAt: { lt: cutoff } }] } });
  return { emailChangeRequests: res.count };
}

/** Marker written by "Mark contacted" (an audit row; no schema change). */
export const CONTACTED_MARK = "Inactive household: marked contacted";

export type InactiveHousehold = {
  id: string;
  name: string;
  lastActivity: Date;
  contactedAt: Date | null;
};

/**
 * Households (public patients, never board rows) whose latest sign of life is older than 3 years. Sign of life = the
 * newest of: created, edited (patient / contact profile), RSVP made or cancelled, check-in, adult member confirmed.
 * Computed on the fly: nothing is stored, so no migration. Automated jobs that touch rows (token clearing) are not
 * counted because rsvp.updatedAt is deliberately not used.
 */
export async function listInactiveHouseholds(now = new Date()): Promise<InactiveHousehold[]> {
  const cutoff = new Date(now.getTime() - INACTIVE_YEARS * 365 * DAY);
  const rows = await prisma.patient.findMany({
    where: { ...PATIENT_ONLY, createdAt: { lt: cutoff }, updatedAt: { lt: cutoff } },
    select: {
      id: true, createdAt: true, updatedAt: true,
      contactProfile: { select: { firstName: true, lastName: true, updatedAt: true } },
      rsvps: { select: { rsvpDate: true, cancelledAt: true } },
      checkIns: { select: { checkInTime: true } },
      householdMembers: { select: { confirmedAt: true } },
    },
  });

  const out: InactiveHousehold[] = [];
  for (const p of rows) {
    const dates: (Date | null | undefined)[] = [
      p.createdAt, p.updatedAt, p.contactProfile?.updatedAt,
      ...p.rsvps.flatMap((r) => [r.rsvpDate, r.cancelledAt]),
      ...p.checkIns.map((c) => c.checkInTime),
      ...p.householdMembers.map((m) => m.confirmedAt),
    ];
    const last = new Date(Math.max(...dates.filter((d): d is Date => !!d).map((d) => d.getTime())));
    if (last < cutoff) out.push({ id: p.id, name: `${p.contactProfile?.firstName ?? ""} ${p.contactProfile?.lastName ?? ""}`.trim() || "—", lastActivity: last, contactedAt: null });
  }
  if (out.length === 0) return out;

  const marks = await prisma.auditLog.findMany({
    where: { action: "PATIENT_UPDATED", details: CONTACTED_MARK, resourceId: { in: out.map((o) => o.id) } },
    orderBy: { createdAt: "desc" },
    select: { resourceId: true, createdAt: true },
  });
  const latest = new Map<string, Date>();
  for (const m of marks) if (m.resourceId && !latest.has(m.resourceId)) latest.set(m.resourceId, m.createdAt);
  out.forEach((o) => (o.contactedAt = latest.get(o.id) ?? null));
  return out.sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime());
}
