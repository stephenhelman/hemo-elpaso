import { NextRequest, NextResponse } from "next/server";
import { registrationOpen } from "@/lib/registration";
import { verifyTurnstile } from "@/lib/turnstile";
import { createPatient, validatePatientInput } from "@/lib/patients/create";
import { sendRegistrationConfirmation } from "@/lib/patients/confirmation";

/**
 * Public "Register for Information" endpoint.
 *
 * - Honeypot ("website") + Cloudflare Turnstile.
 * - NEVER updates an existing record; a matching email/phone only flags the new
 *   record via possibleDuplicateOfId.
 * - The success response is identical whether or not a match exists (no account
 *   enumeration). Validation failures only name the offending field.
 * - Request/response bodies and diagnoses are never logged.
 */
const OK = () => NextResponse.json({ ok: true });

export async function POST(req: NextRequest) {
  // Closed (REGISTRATION_OPEN != "true"): the endpoint doesn't exist as far as callers can tell.
  if (!registrationOpen()) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Honeypot: bots fill it; pretend success, store nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") return OK();

  if (!(await verifyTurnstile(body.turnstileToken))) {
    return NextResponse.json({ ok: false, error: "captcha" }, { status: 400 });
  }

  const v = validatePatientInput({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    address: body.address,
    language: body.language,
    familySize: body.familySize,
    diagnoses: body.diagnoses,
    consentDataAndContact: body.consentDataAndContact,
    consentMedia: body.consentMedia,
  });
  if (!v.ok) {
    return NextResponse.json({ ok: false, error: "invalid", field: v.field }, { status: 400 });
  }

  try {
    const { id } = await createPatient(v.value, { source: "web", method: "web" });

    // Awaited, result checked and logged (EmailLog: kind/status/error name only).
    // A failed send never fails the registration; the admin Patients list shows
    // "Confirmation not sent" so the board can retry.
    if (v.value.email) {
      await sendRegistrationConfirmation({
        id,
        email: v.value.email,
        firstName: v.value.firstName,
        language: v.value.language,
      });
    }
  } catch {
    // No details: the payload contains PII and PHI.
    console.error("register-info: failed to store registration");
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }

  return OK();
}
