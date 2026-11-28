import { mailbox } from "@/lib/site";
import { getRouteRecipients } from "@/lib/email-routing";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import fs from "node:fs";
import path from "node:path";
import { parseAllowlist, resolveEmailMode, splitByAllowlist, type EmailMode } from "@/lib/email/mode";
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
  | "RSVP_ACCESS_LINK"
  | "RSVP_REQUEST_RECEIVED"
  | "RSVP_CONFIRMED_VIRTUAL"
  | "RSVP_REQUEST_DECLINED"
  | "RSVP_WAITLISTED"
  | "RSVP_REMINDER_VIRTUAL"
  | "CONTACT_NOTIFICATION"
  | "CONTACT_AUTO_REPLY"
  | "EMAIL_ROUTING_NOTICE"
  | "ADMIN_CHANGE_NOTICE"
  | "EMAIL_ROUTING_TEST"
  | "DUPLICATE_SIGNIN_NOTICE"
  | "RECORDS_MERGED_NOTICE"
  | "EMAIL_CHANGE_CONFIRMATION"
  | "MEMBER_LEFT_NOTICE"
  | "DELETION_REQUEST_NOTICE"
  | "VOICEMAIL_NOTICE";

export type SendResult =
  | { ok: true; id: string; /** EMAIL_MODE kept it from Resend (capture, or an address not on the allowlist) */ captured?: boolean }
  | { ok: false; errorName: string; status?: number };

async function record(kind: CodeEmailKind, patientId: string | null | undefined, ok: boolean, errorName?: string, status?: "captured") {
  try {
    await prisma.emailLog.create({
      data: {
        templateType: kind,
        recipient: "",
        subject: "",
        status: status ?? (ok ? "sent" : "failed"),
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

  const configured = process.env.EMAIL_FROM;
  if (!configured && process.env.NODE_ENV === "production" && mode() !== "capture") return fail("missing_email_from");
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

  const res = await deliverEmail({ kind: params.kind, from: from!, replyTo, to: params.to, subject: params.subject, html: params.html });
  if (!res.ok) return fail(res.errorName, res.status);
  await record(params.kind, params.patientId, true, undefined, res.captured ? "captured" : undefined);
  return { ok: true, id: res.id, captured: res.captured };
}

// ── THE ONLY PLACE THAT TALKS TO RESEND ─────────────────────────────────────────────────────────────────────────
// No other file may construct a Resend client (npm run check:email-guard fails if it does). Everything that sends an email
// (sendLoggedEmail, the template-driven sendEmail, the admin "send test email", scripts/brand-emails.tsx) calls deliverEmail.

export interface Outboxed { at: string; to: string; kind: string; subject: string; html: string; reason: "capture" | "not_allowlisted" }
type G = typeof globalThis & { __hoepEmailOutbox?: Outboxed[] };
const OUTBOX_MAX = 500;

/** Everything EMAIL_MODE kept from Resend, oldest first. In memory only; tests read it. */
export const emailOutbox = (): Outboxed[] => ((globalThis as G).__hoepEmailOutbox ??= []);
export const clearEmailOutbox = () => { emailOutbox().length = 0; };

const mode = (): EmailMode => resolveEmailMode(process.env);
mode(); // refuse to load with a bad EMAIL_MODE (live outside production, or an unknown value)

/** Local dev only (not Vercel, not production): write the rendered email to .email-outbox/ so it can be opened. */
function writeOutboxFile(o: Outboxed) {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL || process.env.EMAIL_OUTBOX_FILES === "0") return;
  try {
    const dir = path.join(process.cwd(), ".email-outbox");
    fs.mkdirSync(dir, { recursive: true });
    const stamp = o.at.replace(/[:.]/g, "-");
    fs.writeFileSync(path.join(dir, `${stamp}-${o.kind}-${Math.random().toString(36).slice(2, 6)}.html`), `<!-- to: ${o.to}\n     subject: ${o.subject}\n     kind: ${o.kind} (${o.reason}) -->\n${o.html}`);
  } catch { /* a dev convenience: never fail a send because of it */ }
}

function capture(p: { kind: string; to: string | string[]; subject: string; html: string }, reason: Outboxed["reason"]) {
  for (const to of Array.isArray(p.to) ? p.to : [p.to]) {
    const o: Outboxed = { at: new Date().toISOString(), to, kind: p.kind, subject: p.subject, html: p.html, reason };
    const box = emailOutbox();
    box.push(o);
    if (box.length > OUTBOX_MAX) box.splice(0, box.length - OUTBOX_MAX);
    writeOutboxFile(o);
    // kind/reason only: no address, no subject (event titles can imply a diagnosis)
    console.log(`[email ${reason}] ${p.kind}`);
  }
}

export interface DeliverParams {
  kind: string;
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer; contentId?: string }[];
}
export type DeliverResult = { ok: true; id: string; captured: boolean } | { ok: false; errorName: string; status?: number };

/** Send (live), capture, or send only allowlisted addresses (allowlist), per EMAIL_MODE. Never throws on a Resend error: it returns it. */
export async function deliverEmail(p: DeliverParams): Promise<DeliverResult> {
  const m = mode();
  if (m === "capture") { capture(p, "capture"); return { ok: true, id: "captured", captured: true }; }

  let to = p.to;
  if (m === "allowlist") {
    const { send, capture: held } = splitByAllowlist(p.to, parseAllowlist(process.env.EMAIL_DEV_ALLOWLIST));
    if (held.length) capture({ ...p, to: held }, "not_allowlisted");
    if (send.length === 0) return { ok: true, id: "captured", captured: true };
    to = send;
  }

  // Fail loudly instead of silently using Resend's sandbox sender / no key.
  if (!process.env.RESEND_API_KEY) return { ok: false, errorName: "missing_resend_api_key" };
  try {
    // Client built per call so it always sees the runtime env (and a bad key shows up as Resend's own error).
    const res = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: p.from,
      replyTo: p.replyTo,
      to,
      subject: p.subject,
      html: p.html,
      ...(p.attachments ? { attachments: p.attachments } : {}),
    });
    if (res.error) return { ok: false, errorName: res.error.name, status: (res.error as { statusCode?: number }).statusCode ?? undefined };
    return { ok: true, id: res.data?.id ?? "", captured: false };
  } catch (e) {
    return { ok: false, errorName: e instanceof Error ? e.name : "send_exception" };
  }
}
