import { prisma } from "@/lib/db";
import type { ConsentRecord, Prisma } from "@prisma/client";

/**
 * Household evidence: the thin registration always writes consent records, and older/phone/seed rows have a
 * completed-registration stamp or household members. Board-only records (invited by name + org email) have none.
 */
export const HOUSEHOLD_EVIDENCE: Prisma.PatientWhereInput = {
  OR: [
    { registrationCompletedAt: { not: null } },
    { consentRecords: { some: {} } },
    { householdMembers: { some: {} } },
  ],
};

/**
 * Records the settings-only admin may handle: board records (and a former board member's) that hold NO household data.
 * Separation of duties: the admin never sees or touches a record that carries family data.
 */
export const BOARD_ONLY: Prisma.PatientWhereInput = {
  AND: [
    { role: { not: "admin" } },
    { NOT: HOUSEHOLD_EVIDENCE },
    { OR: [{ role: "board" }, { identities: { some: {} } }, { auth0Id: { not: null } }] },
  ],
};

/**
 * "Patients" = households. Spread into a `where` (it uses the AND key only, so it can sit next to a caller's own OR).
 *
 *  - admin rows (the settings-only account) are never households;
 *  - board rows are households only once they carry household data (after the President/VP links or merges their
 *    record to it). A board-only record never appears in patient lists, invitations, attendees or retention;
 *  - every accountless public patient (role "patient", no sign-in linked) is still a household, exactly as before;
 *  - a role "patient" row that has a linked sign-in (e.g. a former board member) needs household evidence, and a
 *    family that has signed in does have it.
 *
 * This replaces `{ role: "patient", auth0Id: null }`, which would have hidden every household whose person signs in
 * or holds a board role. Tests: scripts/check-identities.ts.
 */
export const PATIENT_ONLY: Prisma.PatientWhereInput = {
  AND: [
    { role: { not: "admin" } },
    {
      OR: [
        { role: "patient", auth0Id: null, identities: { none: {} } },
        HOUSEHOLD_EVIDENCE,
      ],
    },
  ],
};

export type CurrentConsents = {
  data_and_contact: boolean | null; // null = never recorded
  media: boolean | null;
};

/** Consent is append-only: the current value is the newest record per type. */
export function currentConsents(
  records: Pick<ConsentRecord, "type" | "granted" | "createdAt">[],
): CurrentConsents {
  const out: CurrentConsents = { data_and_contact: null, media: null };
  const sorted = [...records].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  for (const r of sorted) {
    if (r.type === "data_and_contact" && out.data_and_contact === null)
      out.data_and_contact = r.granted;
    if (r.type === "media" && out.media === null) out.media = r.granted;
  }
  return out;
}

export interface PatientFilters {
  q?: string;
  diagnosis?: string;
  language?: string;
  consent?: string; // data_yes | data_no | media_yes | media_no
  duplicates?: boolean;
  pendingConfirmations?: boolean;
}

export async function listPatients(f: PatientFilters, limit = 2000) {
  const q = f.q?.trim();
  const rows = await prisma.patient.findMany({
    where: {
      ...PATIENT_ONLY,
      ...(f.language === "en" || f.language === "es"
        ? { preferredLanguage: f.language }
        : {}),
      ...(f.diagnosis ? { statedDiagnoses: { has: f.diagnosis } } : {}),
      ...(f.duplicates ? { possibleDuplicateOfId: { not: null } } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" as const } },
              { contactProfile: { firstName: { contains: q, mode: "insensitive" as const } } },
              { contactProfile: { lastName: { contains: q, mode: "insensitive" as const } } },
              { contactProfile: { phone: { contains: q.replace(/[^\d+]/g, "") || q } } },
            ],
          }
        : {}),
    },
    include: {
      contactProfile: true,
      consentRecords: true,
      householdMembers: { select: { status: true } },
      possibleDuplicateOf: { include: { contactProfile: true } },
      emailLogs: {
        where: { templateType: "REGISTRATION_INFO_CONFIRMATION" },
        orderBy: { sentAt: "desc" },
        take: 1,
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  let out = rows.map((r) => ({
    ...r,
    consents: currentConsents(r.consentRecords),
    confirmation: confirmationStatus(r),
    pendingMembers: r.householdMembers.filter((m) => m.status === "pending").length,
  }));
  if (f.pendingConfirmations) out = out.filter((r) => r.pendingMembers > 0);
  if (f.consent) {
    const [type, val] = f.consent.split("_");
    const key = type === "data" ? "data_and_contact" : type === "media" ? "media" : null;
    if (key && (val === "yes" || val === "no")) {
      out = out.filter((r) =>
        val === "yes" ? r.consents[key] === true : r.consents[key] !== true,
      );
    }
  }
  return out;
}

/**
 * Did the "Register for Information" confirmation go out?
 * "n/a" for patients who never get one (no email, or added by phone).
 * "missing" = web registration with an email but no log row (never attempted or logged).
 */
export type ConfirmationStatus = "sent" | "failed" | "missing" | "n/a";
export function confirmationStatus(p: {
  email: string | null;
  source: string;
  emailLogs: { status: string }[];
}): ConfirmationStatus {
  if (!p.email || p.source !== "web") return "n/a";
  const last = p.emailLogs[0]?.status;
  if (last === "sent") return "sent";
  if (last === "failed") return "failed";
  return "missing";
}
