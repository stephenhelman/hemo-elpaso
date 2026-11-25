/**
 * "Mailing list for flyers": approved households that were invited to an event (invitation not removed), chose paper
 * flyers, and have a complete structured address. Pure helpers (split, CSV, label sheets) are unit-tested in
 * scripts/check-flyers.ts. The audit row for an export holds the event id, count and actor only: no names.
 */
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { PATIENT_ONLY } from "@/lib/patients/query";
import type { Permission } from "@/lib/permission-catalog";
import { hasCompleteAddress, householdLang, pickFlyer, type EventFlyers, type Lang } from "./index";

/** President and VP only (the two roles that hold it; reviewers and every other role do not). Used by every route and page here. */
export const MAILING_PERMISSION: Permission = "canManageUsers";

export const LABELS_PER_SHEET = 30; // Avery 5160: 3 across x 10 down

export interface MailingHousehold {
  id: string;
  preferredLanguage: string | null;
  firstName: string | null;
  lastName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
}
export interface MailingRow {
  householdId: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  /** The language of the flyer to put in this envelope. */
  lang: Lang;
}
export interface FixRow { householdId: string; name: string; lang: Lang }

const nameOf = (h: MailingHousehold) => [h.firstName, h.lastName].filter(Boolean).join(" ").trim();

/** Rows with a complete address, and (separately) the ones that chose mail but need an address fixed first. */
export function splitMailing(households: MailingHousehold[], event: EventFlyers): { rows: MailingRow[]; fix: FixRow[] } {
  const rows: MailingRow[] = [], fix: FixRow[] = [];
  for (const h of households) {
    const want = householdLang(h.preferredLanguage);
    const lang = pickFlyer(event, want)?.lang ?? want; // the flyer that exists; the household's own language when the event has none yet
    if (hasCompleteAddress(h)) {
      rows.push({
        householdId: h.id, name: nameOf(h), lang,
        line1: (h.addressLine1 ?? "").trim(), line2: (h.addressLine2 ?? "").trim(), city: (h.city ?? "").trim(), state: (h.state ?? "").trim().toUpperCase(), zip: (h.zipCode ?? "").trim(),
      });
    } else fix.push({ householdId: h.id, name: nameOf(h), lang });
  }
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  rows.sort((a, b) => a.lang.localeCompare(b.lang) || a.zip.localeCompare(b.zip) || byName(a, b));
  fix.sort(byName);
  return { rows, fix };
}

export async function loadMailingList(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, titleEn: true, titleEs: true, flyerEnUrl: true, flyerEsUrl: true } });
  if (!event) return null;
  const patients = await prisma.patient.findMany({
    where: {
      ...PATIENT_ONLY,
      reviewStatus: "approved",
      flyerDelivery: "mail",
      invitations: { some: { eventId, removedAt: null, status: { not: "removed" } } },
    },
    select: {
      id: true, preferredLanguage: true,
      contactProfile: { select: { firstName: true, lastName: true, addressLine1: true, addressLine2: true, city: true, state: true, zipCode: true } },
    },
  });
  const households: MailingHousehold[] = patients.map((p) => ({
    id: p.id, preferredLanguage: p.preferredLanguage,
    firstName: p.contactProfile?.firstName ?? null, lastName: p.contactProfile?.lastName ?? null,
    addressLine1: p.contactProfile?.addressLine1 ?? null, addressLine2: p.contactProfile?.addressLine2 ?? null,
    city: p.contactProfile?.city ?? null, state: p.contactProfile?.state ?? null, zipCode: p.contactProfile?.zipCode ?? null,
  }));
  return { event, hasFlyer: !!(event.flyerEnUrl || event.flyerEsUrl), ...splitMailing(households, event) };
}

// ── outputs ──────────────────────────────────────────────────────────────────────────────────────────────────
/** A cell that starts with = + - @ is read as a formula by spreadsheets: prefix it. */
const cell = (v: string) => {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function mailingCsv(rows: MailingRow[]): string {
  const head = ["language", "name", "address_line_1", "address_line_2", "city", "state", "zip"];
  const lines = rows.map((r) => [r.lang === "es" ? "Spanish" : "English", r.name, r.line1, r.line2, r.city, r.state, r.zip].map(cell).join(","));
  return `﻿${[head.join(","), ...lines].join("\r\n")}\r\n`;
}

/** One entry per printed sheet: rows grouped by language, a new sheet at every language change, 30 labels per sheet. */
export function labelSheets(rows: MailingRow[]): { lang: Lang; labels: MailingRow[] }[] {
  const sheets: { lang: Lang; labels: MailingRow[] }[] = [];
  for (const lang of ["en", "es"] as const) {
    const group = rows.filter((r) => r.lang === lang);
    for (let i = 0; i < group.length; i += LABELS_PER_SHEET) sheets.push({ lang, labels: group.slice(i, i + LABELS_PER_SHEET) });
  }
  return sheets;
}

export const labelLines = (r: MailingRow) => [r.name, r.line1, r.line2, `${r.city}, ${r.state} ${r.zip}`].filter((l) => l.trim());

/** One audit row per export: event id, count, format and the acting board member. No names, no addresses. */
export function auditMailingExport(adminId: string, eventId: string, count: number, format: "csv" | "labels") {
  return audit({
    actorType: "board", actorPatientId: adminId,
    action: AuditAction.FLYER_MAILING_EXPORTED,
    resourceType: "Event", resourceId: eventId,
    details: `Flyer mailing list exported (${format}, ${count} households)`,
    changes: { eventId, count, format, actor: adminId },
  });
}
