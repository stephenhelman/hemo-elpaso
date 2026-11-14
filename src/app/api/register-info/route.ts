import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { verifyTurnstile } from "@/lib/turnstile";
import { createPatient, validatePatientInput } from "@/lib/patients/create";
import RegistrationInfoConfirmation from "@/messages/RegistrationInfoConfirmation";

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
    await createPatient(v.value, { source: "web", method: "web" });

    if (v.value.email) {
      try {
        const html = await render(
          RegistrationInfoConfirmation({
            firstName: v.value.firstName,
            lang: v.value.language,
          }),
        );
        await resend.emails.send({
          from: EMAIL_FROM,
          replyTo: "info@hemo-el-paso.org",
          to: v.value.email,
          subject:
            v.value.language === "es"
              ? "Gracias por registrarte con HOEP"
              : "Thanks for registering with HOEP",
          html,
        });
      } catch {
        console.error("Registration confirmation email failed");
      }
    }
  } catch {
    // No details: the payload contains PII and PHI.
    console.error("register-info: failed to store registration");
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }

  return OK();
}
