import { mailbox } from "@/lib/site";
import { getRouteRecipients } from "@/lib/email-routing";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import { blockedByWithdrawal, isEssentialEmail } from "@/lib/email/policy";

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
  | "MEMBER_CONFIRMATION"
  | "EVENT_INVITATION"
  | "RSVP_CONFIRMATION"
  | "RSVP_REMINDER"
  | "RSVP_CANCELLATION"
  | "CONTACT_NOTIFICATION"
  | "CONTACT_AUTO_REPLY"
  | "EMAIL_ROUTING_NOTICE"
  | "ADMIN_CHANGE_NOTICE"
  | "EMAIL_ROUTING_TEST"
  | "DUPLICATE_SIGNIN_NOTICE"
  | "RECORDS_MERGED_NOTICE";

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

/**
 * Which mailbox an email comes from. The "from" addresses are fixed in code (they must be on the Resend-verified
 * domain); where REPLIES go is the officers' setting (reply.info / reply.events in Admin > Settings > Email routing).
 *   "info"    (default) EMAIL_FROM, e.g. "HOEP <info@<mail domain>>": registration, confirmations, contact auto-reply
 *   "events"  "HOEP Events <events@<email domain>>": invitations, RSVP confirmations, reminders, cancellations
 *   "contact" "HOEP Contact Form <noreply@<email domain>>": the contact-form notification to the board
 *   "noreply" "HOEP <noreply@<email domain>>": routing notices and tests
 * Without EMAIL_FROM (dev only) all of them use Resend's sandbox sender.
 */
export type EmailSender = "info" | "events" | "contact" | "noreply";

export async function sendLoggedEmail(params: {
  kind: CodeEmailKind;
  sender?: EmailSender;
  to: string | string[];
  subject: string;
  html: string;
  patientId?: string | null;
  replyTo?: string;
}): Promise<SendResult> {
  // Withdrawn contact consent stops every non-essential email (lib/email/policy.ts). Not logged as a failure:
  // nothing is wrong, and "Confirmation not sent" must not nag the board to re-send to someone who opted out.
  if (params.patientId && !isEssentialEmail(params.kind)) {
    const records = await prisma.consentRecord.findMany({
      where: { patientId: params.patientId, type: "data_and_contact" },
      select: { type: true, granted: true, createdAt: true },
    });
    if (blockedByWithdrawal(params.kind, records)) return { ok: false, errorName: "consent_withdrawn" };
  }

  const fail = async (errorName: string, status?: number): Promise<SendResult> => {
    console.error("email send failed", { kind: params.kind, error: errorName, status });
    await record(params.kind, params.patientId, false, errorName);
    return { ok: false, errorName, status };
  };

  // Fail loudly instead of silently using Resend's sandbox sender / no key.
  if (!process.env.RESEND_API_KEY) return fail("missing_resend_api_key");
  const configured = process.env.EMAIL_FROM;
  if (!configured && process.env.NODE_ENV === "production") return fail("missing_email_from");
  const events = params.sender === "events";
  const FROM_BY_SENDER: Record<EmailSender, string | null> = {
    info: configured ?? null,
    events: `HOEP Events <${mailbox("events")}>`,
    contact: `HOEP Contact Form <${mailbox("noreply")}>`,
    noreply: `HOEP <${mailbox("noreply")}>`,
  };
  const from = configured ? FROM_BY_SENDER[params.sender ?? "info"] : "HOEP Events <onboarding@resend.dev>"; // non-production only
  // Reply-to is the officers' setting; an explicit replyTo (the contact form's submitter) wins.
  const replyTo = params.replyTo ?? (await getRouteRecipients(events ? "reply.events" : "reply.info"))[0];

  try {
    // Client built per call so it always sees the runtime env (and a bad key shows up as
    // Resend's own error instead of a stale import-time value).
    const res = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: from!,
      replyTo,
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
