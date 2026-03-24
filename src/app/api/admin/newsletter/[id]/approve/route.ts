import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { render } from "@react-email/render";
import { AuditAction } from "@prisma/client";
import MemberNewsletter from "@/messages/MemberNewsletter";
import type { NewsletterContent } from "@/lib/newsletter-generator";
import { generateUnsubscribeToken } from "@/lib/unsubscribe-token";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface Props {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const { admin, error } = await requirePermission("canApproveNewsletter");
    if (error) return error;

    const newsletter = await prisma.newsletter.findUnique({
      where: { id: params.id },
    });

    if (!newsletter) {
      return NextResponse.json(
        { error: "Newsletter not found" },
        { status: 404 },
      );
    }

    if (newsletter.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        {
          error: `Cannot approve newsletter with status: ${newsletter.status}`,
        },
        { status: 400 },
      );
    }

    const { presidentMessageEn, presidentMessageEs } = await req.json();

    if (!presidentMessageEn?.trim() || !presidentMessageEs?.trim()) {
      return NextResponse.json(
        { error: "President message is required in both languages" },
        { status: 400 },
      );
    }

    // Mark as SENT immediately so we don't risk double-sending
    const updated = await prisma.newsletter.update({
      where: { id: params.id },
      data: {
        status: "SENT",
        presidentMessageEn,
        presidentMessageEs,
        sentAt: new Date(),
      },
    });

    // Fetch all patients who have consented to contact
    // and have completed registration
    const patients = await prisma.patient.findMany({
      where: {
        consentToContact: true,
        registrationCompletedAt: { not: null },
      },
      select: {
        id: true,
        email: true,
        preferredLanguage: true,
        contactProfile: {
          select: { firstName: true },
        },
      },
    });

    const content =
      newsletter.generatedContentJson as unknown as NewsletterContent;
    const monthName = MONTH_NAMES[newsletter.month - 1];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

    // Split patients by language
    const enPatients = patients.filter((p) => p.preferredLanguage !== "es");
    const esPatients = patients.filter((p) => p.preferredLanguage === "es");

    // Pre-render both language versions of the email body
    // (personalized only by name — we send in batches via Resend)
    let sentCount = 0;
    let failedCount = 0;

    // Send in batches of 50 to stay within Resend rate limits
    const BATCH_SIZE = 50;

    const sendBatch = async (batch: typeof patients, lang: "en" | "es") => {
      for (const patient of batch) {
        const firstName = patient.contactProfile?.firstName || "Friend";
        try {
          const token = generateUnsubscribeToken(patient.id);
          const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${token}`;

          const html = render(
            MemberNewsletter({
              patientName: firstName,
              lang,
              month: monthName,
              monthEs: monthName,
              year: newsletter.year,
              presidentMessageEn,
              presidentMessageEs,
              eventRecaps: content.eventRecaps,
              upcomingEvents: content.upcomingEvents,
              unsubscribeUrl,
            }),
          );

          const subject =
            lang === "es"
              ? `📰 Boletín de HOEP — ${monthName} ${newsletter.year}`
              : `📰 HOEP Newsletter — ${monthName} ${newsletter.year}`;

          await resend.emails.send({
            from: process.env.EMAIL_FROM || "HOEP <noreply@hemo-el-paso.org>",
            to: patient.email,
            subject,
            html,
          });

          sentCount++;
        } catch (err) {
          console.error(`Failed to send newsletter to ${patient.email}:`, err);
          failedCount++;
        }
      }
    };

    // Process English patients in batches
    for (let i = 0; i < enPatients.length; i += BATCH_SIZE) {
      await sendBatch(enPatients.slice(i, i + BATCH_SIZE), "en");
    }

    // Process Spanish patients in batches
    for (let i = 0; i < esPatients.length; i += BATCH_SIZE) {
      await sendBatch(esPatients.slice(i, i + BATCH_SIZE), "es");
    }

    await prisma.auditLog.create({
      data: {
        patientId: admin!.id,
        action: AuditAction.NEWSLETTER_SENT,
        resourceType: "Newsletter",
        resourceId: params.id,
        details: `Newsletter ${monthName} ${newsletter.year} sent. ${sentCount} sent, ${failedCount} failed.`,
      },
    });

    return NextResponse.json({
      success: true,
      newsletter: updated,
      sentCount,
      failedCount,
    });
  } catch (error: any) {
    console.error("Newsletter approve error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve newsletter" },
      { status: 500 },
    );
  }
}
