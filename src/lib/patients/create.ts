import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CONSENT_TEXT_VERSION, type ConsentType } from "@/content/consent";
import { sanitizeDiagnoses } from "./diagnoses";
import {
  cleanText,
  isValidEmail,
  normalizeEmail,
  normalizePhone,
} from "./normalize";

export interface PatientInput {
  firstName: unknown;
  lastName: unknown;
  email: unknown;
  phone: unknown;
  address: unknown;
  language: unknown;
  familySize: unknown;
  diagnoses: unknown;
  consentDataAndContact: unknown;
  consentMedia: unknown;
}

export type ValidatedPatient = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  language: "en" | "es";
  familySize: number;
  diagnoses: string[];
  consentDataAndContact: boolean;
  consentMedia: boolean;
};

export type ValidationResult =
  | { ok: true; value: ValidatedPatient }
  | { ok: false; field: string };

/**
 * Shared by the public form and the admin "Add patient"/edit forms.
 * Every patient needs at least one of email or phone. Email/phone are
 * normalized here; consent to data+contact is required.
 */
export function validatePatientInput(
  i: PatientInput,
  opts: { requireConsent: boolean } = { requireConsent: true },
): ValidationResult {
  const firstName = cleanText(i.firstName, 100);
  const lastName = cleanText(i.lastName, 100);
  if (!firstName) return { ok: false, field: "firstName" };
  if (!lastName) return { ok: false, field: "lastName" };

  const email = normalizeEmail(i.email);
  if (email && !isValidEmail(email)) return { ok: false, field: "email" };
  const phoneRaw = cleanText(i.phone, 40);
  const phone = normalizePhone(phoneRaw);
  if (phoneRaw && !phone) return { ok: false, field: "phone" };
  if (!email && !phone) return { ok: false, field: "contact" };

  const language = i.language === "es" ? "es" : "en";
  const fs = Number(i.familySize);
  if (!Number.isInteger(fs) || fs < 1 || fs > 30)
    return { ok: false, field: "familySize" };

  const consentDataAndContact = i.consentDataAndContact === true;
  if (opts.requireConsent && !consentDataAndContact)
    return { ok: false, field: "consentDataAndContact" };

  return {
    ok: true,
    value: {
      firstName,
      lastName,
      email,
      phone,
      address: cleanText(i.address, 300) || null,
      language,
      familySize: fs,
      diagnoses: sanitizeDiagnoses(i.diagnoses),
      consentDataAndContact,
      consentMedia: i.consentMedia === true,
    },
  };
}

/** Oldest existing PATIENT (never board/admin) sharing email or phone, resolved to its root. */
export async function findDuplicateRootId(
  email: string | null,
  phone: string | null,
  excludeId?: string,
): Promise<string | null> {
  const or: object[] = [];
  if (email) or.push({ email });
  if (phone) or.push({ contactProfile: { phone } });
  if (or.length === 0) return null;
  const match = await prisma.patient.findFirst({
    where: { role: "patient", OR: or, ...(excludeId ? { id: { not: excludeId } } : {}) },
    orderBy: { createdAt: "asc" },
    select: { id: true, possibleDuplicateOfId: true },
  });
  if (!match) return null;
  return match.possibleDuplicateOfId ?? match.id;
}

/**
 * Create a patient + consent records (append-only) + audit entry.
 * NEVER updates an existing record: a match only sets possibleDuplicateOfId.
 * The audit entry records no PII and no diagnoses.
 */
export async function createPatient(
  v: ValidatedPatient,
  ctx: {
    source: "web" | "phone";
    method: "web" | "phone";
    recordedByBoardUserId?: string | null;
  },
) {
  const duplicateOfId = await findDuplicateRootId(v.email, v.phone);

  const consents: { type: ConsentType; granted: boolean }[] = [
    { type: "data_and_contact", granted: v.consentDataAndContact },
    { type: "media", granted: v.consentMedia },
  ];

  const patient = await prisma.patient.create({
    data: {
      auth0Id: null,
      email: v.email,
      role: "patient",
      preferredLanguage: v.language,
      familySize: v.familySize,
      statedDiagnoses: v.diagnoses,
      source: ctx.source,
      possibleDuplicateOfId: duplicateOfId,
      contactProfile: {
        create: {
          firstName: v.firstName,
          lastName: v.lastName,
          phone: v.phone,
          addressLine1: v.address,
        },
      },
      consentRecords: {
        create: consents.map((c) => ({
          type: c.type,
          granted: c.granted,
          textVersion: CONSENT_TEXT_VERSION,
          method: ctx.method,
          recordedByBoardUserId: ctx.recordedByBoardUserId ?? null,
        })),
      },
    },
    select: { id: true },
  });

  await prisma.auditLog.create({
    data: {
      patientId: ctx.recordedByBoardUserId ?? null,
      action: AuditAction.PATIENT_CREATED,
      resourceType: "Patient",
      resourceId: patient.id,
      details: `Patient created via ${ctx.source}${duplicateOfId ? " (possible duplicate flagged)" : ""}`,
    },
  });

  return { id: patient.id, duplicateOfId };
}
