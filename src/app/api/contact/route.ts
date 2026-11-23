import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import ContactFormNotification from "@/messages/ContactFormNotification";
import ContactAutoReply from "@/messages/ContactAutoReply";
import { getContactRecipient } from "@/lib/contact-routing";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendLoggedEmail } from "@/lib/email/send";

const MIN_SUBMIT_MS = 3000;
const LINK_RE = /https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|io|ru|xyz|info|biz|top|site|online|link|co|us|me|ly)\b/i;
const LINK_FLAG = "[Contains links: please verify]";
const FAKE_OK = () => NextResponse.json({ success: true });

const reasonLabels: Record<string, { en: string; es: string }> = {
  general: { en: "General Inquiry", es: "Consulta General" },
  family: { en: "Family / Patient Support", es: "Apoyo Familiar / Paciente" },
  volunteer: { en: "Volunteering", es: "Voluntariado" },
  sponsor: { en: "Sponsorship", es: "Patrocinio" },
  media: { en: "Media / Press", es: "Medios / Prensa" },
  other: { en: "Other", es: "Otro" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, reason, message, locale = "en" } = body;

    // Honeypot: bots fill it. Pretend success, send nothing.
    if (typeof body.website === "string" && body.website.trim() !== "") return FAKE_OK();

    // Too fast to be a person (missing/invalid timing counts as a bot). Same fake success.
    const elapsed = Number(body.elapsedMs);
    if (!Number.isFinite(elapsed) || elapsed < MIN_SUBMIT_MS) return FAKE_OK();

    if (!(await verifyTurnstile(body.turnstileToken))) {
      return NextResponse.json({ error: "captcha" }, { status: 400 });
    }

    // Basic validation
    if (
      !name?.trim() ||
      !email?.trim() ||
      !reason?.trim() ||
      !message?.trim()
    ) {
      return NextResponse.json(
        { error: "Name, email, reason, and message are required" },
        { status: 400 },
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    const isEs = locale === "es";
    const reasonLabel = reasonLabels[reason]?.[locale as "en" | "es"] ?? reason;

    // Recipients for this reason (officers' setting; code defaults if unset)
    const toEmail = await getContactRecipient(reason);

    // Still delivered, but flagged so a human looks before clicking anything.
    const hasLinks = LINK_RE.test(`${message} ${name}`);

    // ── 1. Notification email routed by reason ────────────────────────────────
    const notificationHtml = await render(
      ContactFormNotification({ name, email, phone, reason, message, locale }),
    );

    // Sent through the shared sender (lib/email/send.ts): it checks the Resend result and writes the EmailLog row.
    const notified = await sendLoggedEmail({
      kind: "CONTACT_NOTIFICATION",
      sender: "contact",
      to: toEmail,
      replyTo: email, // clicking reply in Gmail goes straight to the sender
      subject:
        (isEs
          ? `Nuevo mensaje: ${reasonLabel} — ${name}`
          : `New message: ${reasonLabel} — ${name}`) +
        (hasLinks ? ` ${LINK_FLAG}` : ""),
      html: notificationHtml,
    });
    // If the board notification didn't go out the message would be lost, so fail the request.
    if (!notified.ok) return NextResponse.json({ error: "Failed to send message" }, { status: 502 });

    // ── 2. Auto-reply confirmation to the sender ──────────────────────────────
    const autoReplyHtml = await render(
      ContactAutoReply({ name, reasonLabel, lang: isEs ? "es" : "en" }),
    );
    // Best effort: a failed auto-reply is logged by the sender and does not fail the request.
    await sendLoggedEmail({
      kind: "CONTACT_AUTO_REPLY",
      sender: "info",
      to: email,
      subject: isEs
        ? "Hemos recibido su mensaje — HOEP"
        : "We received your message — HOEP",
      html: autoReplyHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 },
    );
  }
}
