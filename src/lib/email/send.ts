import { contactEmail } from "@/lib/site";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

/**
 * The ONE way code-built emails (registration confirmation, invitations, RSVP
 * confirmation/reminder/cancellation) get sent.
 *
 * Why it exists: the Resend SDK does NOT throw on API errors, it returns
 * { data, error }. Ignoring `error` made rejected sends look successful.
 *
 * Privacy: event titles can imply a diagnosis, so the EmailLog row stores ONLY
 * kind, status, error NAME and patientId. No subject, no body, no recipient
 * address (those columns are required, so they hold ""). Server logs carry the
 * kind, error name and HTTP status only. No addresses, names or content.
 */
export type CodeEmailKind =
  | "REGISTRATION_INFO_CONFIRMATION"
  | "EVENT_INVITATION"
  | "RSVP_CONFIRMATION"
  | "RSVP_REMINDER"
  | "RSVP_CANCELLATION";

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; errorName: string; status?: number };

async function record(kind: CodeEmailKind, patientId: string | null | undefined, ok: boolean, errorName?: string) {
  try {
    await prisma.emailLog.create({
      data: {
        templateType: kind,
        recipient: "",
        subject: "",
        status: ok ? "sent" : "failed",
        error: ok ? null : errorName ?? "unknown_error",
        patientId: patientId ?? null,
      },
    });
  } catch {
    console.error("email log write failed", { kind });
  }
}

export async function sendLoggedEmail(params: {
  kind: CodeEmailKind;
  to: string;
  subject: string;
  html: string;
  patientId?: string | null;
  replyTo?: string;
}): Promise<SendResult> {
  const fail = async (errorName: string, status?: number): Promise<SendResult> => {
    console.error("email send failed", { kind: params.kind, error: errorName, status });
    await record(params.kind, params.patientId, false, errorName);
    return { ok: false, errorName, status };
  };

  // Fail loudly instead of silently using Resend's sandbox sender / no key.
  if (!process.env.RESEND_API_KEY) return fail("missing_resend_api_key");
  const from = process.env.EMAIL_FROM;
  if (!from && process.env.NODE_ENV === "production") return fail("missing_email_from");

  try {
    // Client built per call so it always sees the runtime env (and a bad key shows up as
    // Resend's own error instead of a stale import-time value).
    const res = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: from || "HOEP Events <onboarding@resend.dev>", // non-production only
      replyTo: params.replyTo ?? contactEmail(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (res.error) return fail(res.error.name, (res.error as { statusCode?: number }).statusCode ?? undefined);
    await record(params.kind, params.patientId, true);
    return { ok: true, id: res.data?.id ?? "" };
  } catch (e) {
    return fail(e instanceof Error ? e.name : "send_exception");
  }
}
