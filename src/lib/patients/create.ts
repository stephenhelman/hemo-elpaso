import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CONSENT_TEXT_VERSION, type ConsentType } from "@/content/consent";
import { sanitizeDiagnoses } from "./diagnoses";
import { addressColumns, parseAddress, type Address } from "@/lib/address/validate";
import { defaultFlyerDelivery, isFlyerDelivery, validateFlyerDelivery, type FlyerDelivery } from "@/lib/flyers";
import { randomUUID } from "crypto";
import { generateToken, hashToken } from "@/lib/tokens";
import { validateMembers, type ValidatedMember } from "@/lib/households/members";
import { recomputeHousehold } from "@/lib/households/sync";
import { CONFIRM_TOKEN_DAYS } from "@/lib/households/constants";
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
  address: unknown; // { line1, line2, city, state, zip } (lib/address); all empty = no address
  language: unknown;
  familySize: unknown;
  diagnoses: unknown; // the PRIMARY person's own
  members?: unknown; // household members (everyone except the primary)
  consentDataAndContact: unknown;
  consentMedia: unknown;
  consentSms?: unknown; // optional; needs a phone number
  consentNewsletter?: unknown; // optional; needs an email
  attestation?: unknown; // "I am 18+ and guardian of any minors listed"
  phoneCanText?: unknown; // true | false | null/absent (not asked / not sure). Ignored without a phone number.
  flyerDelivery?: unknown; // email | mail | none; empty = the default (email if any, else mail if the address is complete, else none)
}

export type ValidatedPatient = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: Address | null;
  language: "en" | "es";
  familySize: number;
  diagnoses: string[]; // the primary's own (Patient.primaryDiagnoses)
  members: ValidatedMember[];
  consentDataAndContact: boolean;
  consentMedia: boolean;
  consentSms: boolean;
  consentNewsletter: boolean;
  attestation: boolean;
  /** The primary's phone can receive texts (null = not stated). Always null without a phone. Stored only: no texting yet. */
  phoneCanText: boolean | null;
  /** Create: always resolved. Edit: null = not sent, leave the household's choice alone. */
  flyerDelivery: FlyerDelivery | null;
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
  opts: { requireConsent: boolean; household?: boolean } = { requireConsent: true },
): ValidationResult {
  // Edits (requireConsent:false) don't touch the household: members are managed
  // through their own actions, and familySize is derived (1 + members).
  // `household:false` (door walk-ins) registers just the one person.
  const editing = !opts.requireConsent;
  const withHousehold = opts.household !== false && !editing;
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

  const addr = parseAddress(i.address);
  if (!addr.ok) return { ok: false, field: addr.field };

  const language = i.language === "es" ? "es" : "en";
  let members: ValidatedMember[] = [];
  let fs = 1;
  if (withHousehold) {
    const m = validateMembers(i.members, i.familySize);
    if (!m.ok) return m;
    members = m.members;
    fs = 1 + members.length;
  }

  // Flyer delivery: empty = default; a value must be valid ("email" needs an email address).
  const fdRaw = typeof i.flyerDelivery === "string" ? i.flyerDelivery.trim() : "";
  let flyerDelivery: FlyerDelivery | null;
  if (fdRaw) {
    flyerDelivery = validateFlyerDelivery(fdRaw, { email });
    if (!flyerDelivery) return { ok: false, field: "flyerDelivery" };
  } else if (i.flyerDelivery != null && i.flyerDelivery !== "" && !isFlyerDelivery(i.flyerDelivery)) {
    return { ok: false, field: "flyerDelivery" };
  } else {
    flyerDelivery = editing ? null : defaultFlyerDelivery({ email, address: addr.value ? { addressLine1: addr.value.line1, city: addr.value.city, state: addr.value.state, zipCode: addr.value.zip } : null });
  }

  const consentDataAndContact = i.consentDataAndContact === true;
  if (opts.requireConsent && !consentDataAndContact)
    return { ok: false, field: "consentDataAndContact" };
  // Optional contact consents are only meaningful with something to contact.
  const consentSms = i.consentSms === true;
  if (consentSms && !phone) return { ok: false, field: "consentSms" };
  const consentNewsletter = i.consentNewsletter === true;
  if (consentNewsletter && !email) return { ok: false, field: "consentNewsletter" };
  const attestation = i.attestation === true;
  if (opts.requireConsent && withHousehold && !attestation) return { ok: false, field: "attestation" };

  return {
    ok: true,
    value: {
      firstName,
      lastName,
      email,
      phone,
      address: addr.value,
      language,
      familySize: fs,
      diagnoses: sanitizeDiagnoses(i.diagnoses),
      members,
      consentDataAndContact,
      consentMedia: i.consentMedia === true,
      consentSms,
      consentNewsletter,
      attestation,
      phoneCanText: phone && typeof i.phoneCanText === "boolean" ? i.phoneCanText : null,
      flyerDelivery,
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

export type PendingMemberInvite = {
  memberId: string;
  email: string;
  firstName: string;
  rawToken: string; // exists only here, to build the emailed link
};

/**
 * Create a patient (the primary) + household members + consent records
 * (append-only) + audit entry, atomically.
 * NEVER updates an existing record: a match only sets possibleDuplicateOfId.
 * The audit entry records no PII and no diagnoses.
 * Adults with an email get a hashed confirmation token (valid 30 days); the raw
 * tokens are returned so the caller can email them.
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
    { type: "sms", granted: v.consentSms },
    { type: "newsletter", granted: v.consentNewsletter },
    ...(v.attestation ? [{ type: "age_guardian_attestation" as const, granted: true }] : []),
  ];

  const expires = new Date(Date.now() + CONFIRM_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  const invites: PendingMemberInvite[] = [];
  const memberRows = v.members.map((m) => {
    let tokenHash: string | null = null;
    if (m.status === "pending" && m.email) {
      const rawToken = generateToken();
      tokenHash = hashToken(rawToken);
      invites.push({ memberId: "", email: m.email, firstName: m.firstName, rawToken });
    }
    return {
      id: randomUUID(), // known up front so callers can map form positions to member ids
      firstName: m.firstName,
      lastName: m.lastName,
      relationship: m.relationship,
      ageGroup: m.ageGroup,
      statedDiagnoses: m.statedDiagnoses,
      email: m.email,
      confirmByPhone: m.confirmByPhone,
      status: m.status,
      confirmTokenHash: tokenHash,
      confirmTokenExpiresAt: tokenHash ? expires : null,
    };
  });

  const patientId = await prisma.$transaction(async (tx) => {
    const patient = await tx.patient.create({
      data: {
        auth0Id: null,
        email: v.email,
        role: "patient",
        preferredLanguage: v.language,
        flyerDelivery: v.flyerDelivery ?? "email",
        phoneCanText: v.phoneCanText,
        familySize: v.familySize,
        primaryDiagnoses: v.diagnoses,
        statedDiagnoses: v.diagnoses, // recomputed below
        source: ctx.source,
        possibleDuplicateOfId: duplicateOfId,
        // Registration review: a web registration waits for review; a household an officer adds is approved by that officer.
        ...(ctx.recordedByBoardUserId
          ? { reviewStatus: "approved", reviewedAt: new Date(), reviewedByPatientId: ctx.recordedByBoardUserId }
          : { reviewStatus: "pending_review" }),
        contactProfile: {
          create: {
            firstName: v.firstName,
            lastName: v.lastName,
            phone: v.phone,
            ...addressColumns(v.address),
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
        householdMembers: { create: memberRows },
      },
      select: { id: true, householdMembers: { select: { id: true, confirmTokenHash: true } } },
    });
    // Map member ids back onto the invites (matched by token hash).
    for (const inv of invites) {
      const h = hashToken(inv.rawToken);
      inv.memberId = patient.householdMembers.find((m) => m.confirmTokenHash === h)!.id;
    }
    await recomputeHousehold(tx, patient.id);
    return patient.id;
  });

  await prisma.auditLog.create({
    data: {
      patientId: ctx.recordedByBoardUserId ?? null,
      action: AuditAction.PATIENT_CREATED,
      resourceType: "Patient",
      resourceId: patientId,
      details: `Patient created via ${ctx.source} with ${v.members.length} household member(s)${duplicateOfId ? " (possible duplicate flagged)" : ""}`,
    },
  });

  if (ctx.recordedByBoardUserId) {
    await prisma.auditLog.create({
      data: {
        patientId: ctx.recordedByBoardUserId, actorType: "board", action: AuditAction.REVIEW_STATUS_CHANGED, resourceType: "Patient", resourceId: patientId,
        details: "Review status (new) -> approved: household added by an officer",
        changes: { householdId: patientId, from: null, status: "approved", reasonCode: null },
      },
    });
  }

  return { id: patientId, duplicateOfId, invites, memberIds: memberRows.map((r) => r.id) };
}
