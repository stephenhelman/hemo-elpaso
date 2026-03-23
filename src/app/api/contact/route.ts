import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import ContactFormNotification from "@/messages/ContactFormNotification";

const resend = new Resend(process.env.RESEND_API_KEY);

const CONTACT_EMAIL = "info@hemo-el-paso.org";

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
    const reasonLabel = reasonLabels[reason]?.[locale] ?? reason;

    // ── 1. Notification email to info@hemo-el-paso.org ────────────────────────
    const notificationHtml = await render(
      ContactFormNotification({ name, email, phone, reason, message, locale }),
    );

    await resend.emails.send({
      from: `HOEP Contact Form <noreply@hemo-el-paso.org>`,
      to: CONTACT_EMAIL,
      replyTo: email, // clicking reply in Gmail goes straight to the sender
      subject: isEs
        ? `Nuevo mensaje: ${reasonLabel} — ${name}`
        : `New message: ${reasonLabel} — ${name}`,
      html: notificationHtml,
    });

    // ── 2. Auto-reply confirmation to the sender ──────────────────────────────
    await resend.emails.send({
      from: `HOEP <info@hemo-el-paso.org>`,
      to: email,
      subject: isEs
        ? "Hemos recibido su mensaje — HOEP"
        : "We received your message — HOEP",
      html: isEs
        ? `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
            <h2 style="color:#8B1538">Gracias, ${name}</h2>
            <p>Hemos recibido su mensaje sobre <strong>${reasonLabel}</strong>.</p>
            <p>Nos pondremos en contacto en 1–2 días hábiles.</p>
            <hr style="border-color:#e5e7eb;margin:24px 0"/>
            <p style="color:#6b7280;font-size:13px">
              Hemophilia Outreach of El Paso<br/>
              info@hemo-el-paso.org
            </p>
          </div>
        `
        : `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
            <h2 style="color:#8B1538">Thank you, ${name}</h2>
            <p>We received your message regarding <strong>${reasonLabel}</strong>.</p>
            <p>We'll get back to you within 1–2 business days.</p>
            <hr style="border-color:#e5e7eb;margin:24px 0"/>
            <p style="color:#6b7280;font-size:13px">
              Hemophilia Outreach of El Paso<br/>
              info@hemo-el-paso.org
            </p>
          </div>
        `,
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
