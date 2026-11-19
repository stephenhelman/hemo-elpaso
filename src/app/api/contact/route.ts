import { mailbox, contactEmail } from "@/lib/site";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import ContactFormNotification from "@/messages/ContactFormNotification";
import ContactAutoReply from "@/messages/ContactAutoReply";
import { getContactRecipient } from "@/lib/contact-routing";
import { verifyTurnstile } from "@/lib/turnstile";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Determine the correct recipient based on reason
    const toEmail = await getContactRecipient(reason);

    // Still delivered, but flagged so a human looks before clicking anything.
    const hasLinks = LINK_RE.test(`${message} ${name}`);

    // ── 1. Notification email routed by reason ────────────────────────────────
    const notificationHtml = await render(
      ContactFormNotification({ name, email, phone, reason, message, locale }),
    );

    const notified = await resend.emails.send({
      from: `HOEP Contact Form <${mailbox("noreply")}>`,
      to: toEmail,
      replyTo: email, // clicking reply in Gmail goes straight to the sender
      subject:
        (isEs
          ? `Nuevo mensaje: ${reasonLabel} — ${name}`
          : `New message: ${reasonLabel} — ${name}`) +
        (hasLinks ? ` ${LINK_FLAG}` : ""),
      html: notificationHtml,
    });
    // The SDK returns errors instead of throwing. If the board notification
    // didn't go out the message would be lost, so fail the request.
    if (notified.error) {
      console.error("contact notification failed", { error: notified.error.name });
      return NextResponse.json({ error: "Failed to send message" }, { status: 502 });
    }

    // ── 2. Auto-reply confirmation to the sender ──────────────────────────────
    const autoReplyHtml = await render(
      ContactAutoReply({ name, reasonLabel, lang: isEs ? "es" : "en" }),
    );
    const autoReply = await resend.emails.send({
      from: `HOEP <${contactEmail()}>`,
      to: email,
      subject: isEs
        ? "Hemos recibido su mensaje — HOEP"
        : "We received your message — HOEP",
      html: autoReplyHtml,
    });
    if (autoReply.error) {
      console.error("contact auto-reply failed", { error: autoReply.error.name });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 },
    );
  }
}
