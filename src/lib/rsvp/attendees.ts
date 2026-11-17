import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type Tx = Prisma.TransactionClient;

export const MAX_GUESTS = 10;
export const MAX_PARTY = 30;

/** Who is coming on an RSVP: the primary, chosen household members, and unlisted guests. */
export type AttendeeSelection = { primary: boolean; memberIds: string[]; guests: number };

export const selectionTotal = (s: AttendeeSelection) => (s.primary ? 1 : 0) + s.memberIds.length + s.guests;

/** Members who can be listed on an RSVP: everyone except declined/expired placeholders. */
export const SELECTABLE_STATUSES = ["not_required", "pending", "confirmed"] as const;

export async function selectableMembers(patientId: string, db: Tx | typeof prisma = prisma) {
  return db.householdMember.findMany({
    where: { patientId, status: { in: [...SELECTABLE_STATUSES] } },
    select: { id: true, firstName: true, relationship: true, ageGroup: true, status: true },
    orderBy: { createdAt: "asc" },
  });
}

/** Everyone checked, no guests: the default shown on every form. */
export async function defaultSelection(patientId: string): Promise<AttendeeSelection> {
  const members = await selectableMembers(patientId);
  return { primary: true, memberIds: members.map((m) => m.id), guests: 0 };
}

/**
 * Clean untrusted input: unknown/declined members are rejected (null), duplicates collapse,
 * guests are 0..MAX_GUESTS, and at least one person or guest is required.
 */
export function parseSelection(raw: unknown, selectableIds: string[]): AttendeeSelection | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const guests = Number(r.guests ?? 0);
  if (!Number.isInteger(guests) || guests < 0 || guests > MAX_GUESTS) return null;
  const ids = Array.isArray(r.memberIds) ? r.memberIds : [];
  if (!ids.every((id) => typeof id === "string" && selectableIds.includes(id))) return null;
  const sel: AttendeeSelection = { primary: r.primary === true, memberIds: Array.from(new Set(ids as string[])), guests };
  const total = selectionTotal(sel);
  return total >= 1 && total <= MAX_PARTY ? sel : null;
}

/** attendeeCount = attendee rows + guestCount. Call after any change to either. */
export async function recountRsvp(tx: Tx, rsvpId: string) {
  const [rows, r] = await Promise.all([
    tx.rsvpAttendee.count({ where: { rsvpId } }),
    tx.rsvp.findUnique({ where: { id: rsvpId }, select: { guestCount: true } }),
  ]);
  if (!r) return 0;
  const total = rows + r.guestCount;
  await tx.rsvp.update({ where: { id: rsvpId }, data: { attendeeCount: total } });
  return total;
}

/** Make an RSVP's attendee rows and guest count match the selection (rows kept keep their check-in time). */
export async function applyAttendees(tx: Tx, rsvpId: string, sel: AttendeeSelection) {
  const existing = await tx.rsvpAttendee.findMany({ where: { rsvpId } });
  const keepMembers = new Set(sel.memberIds);
  const drop = existing.filter((a) => (a.isPrimary ? !sel.primary : !a.householdMemberId || !keepMembers.has(a.householdMemberId)));
  if (drop.length) await tx.rsvpAttendee.deleteMany({ where: { id: { in: drop.map((a) => a.id) } } });
  const have = new Set(existing.filter((a) => !drop.includes(a)).map((a) => (a.isPrimary ? "primary" : a.householdMemberId)));
  const create: Prisma.RsvpAttendeeCreateManyInput[] = [];
  if (sel.primary && !have.has("primary")) create.push({ rsvpId, isPrimary: true });
  for (const id of sel.memberIds) if (!have.has(id)) create.push({ rsvpId, householdMemberId: id });
  if (create.length) await tx.rsvpAttendee.createMany({ data: create });
  await tx.rsvp.update({ where: { id: rsvpId }, data: { guestCount: sel.guests } });
  return recountRsvp(tx, rsvpId);
}

/**
 * A member declined / expired / was removed: take them off every RSVP they have
 * not yet attended and fix those totals. (Rows already checked in stay as history.)
 */
export async function dropMemberFromRsvps(tx: Tx, memberId: string) {
  const rows = await tx.rsvpAttendee.findMany({
    where: { householdMemberId: memberId, checkedInAt: null },
    select: { id: true, rsvpId: true },
  });
  if (!rows.length) return;
  await tx.rsvpAttendee.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
  for (const rsvpId of Array.from(new Set(rows.map((r) => r.rsvpId)))) await recountRsvp(tx, rsvpId);
}
