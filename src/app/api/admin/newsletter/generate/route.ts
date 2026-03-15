import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { createNewsletterDraft } from "@/lib/newsletter-generator";
import { resend } from "@/lib/resend";
import { render } from "@react-email/render";
import NewsletterDraftReady from "@/messages/NewsletterDraftReady";

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

export async function POST(req: NextRequest) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) return error;

    const body = await req.json();
    const { month, year } = body;

    if (!month || !year) {
      return NextResponse.json(
        { error: "month and year are required" },
        { status: 400 },
      );
    }

    // Generate the draft
    const { newsletter, alreadyExists } = await createNewsletterDraft(
      month,
      year,
      admin!.email,
    );

    if (alreadyExists) {
      return NextResponse.json(
        {
          error: `A newsletter for ${MONTH_NAMES[month - 1]} ${year} already exists with status: ${newsletter.status}`,
          newsletterId: newsletter.id,
        },
        { status: 409 },
      );
    }

    // Find the President to notify
    const presidentRole = await prisma.boardRole.findFirst({
      where: { role: "PRESIDENT", active: true },
      include: { patient: true },
    });

    if (presidentRole) {
      const content = newsletter.generatedContentJson as any;
      const previewUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/newsletter/${newsletter.id}`;
      const monthName = MONTH_NAMES[month - 1];

      const firstName =
        presidentRole.patient.contactProfile?.firstName || "President";

      const emailHtml = render(
        NewsletterDraftReady({
          presidentName: firstName,
          month: monthName,
          year,
          eventCount: content.eventRecaps?.length ?? 0,
          upcomingCount: content.upcomingEvents?.length ?? 0,
          previewUrl,
        }),
      );

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "HOEP <noreply@hemo-el-paso.org>",
        to: presidentRole.patient.email,
        subject: `📰 Your ${monthName} ${year} Newsletter Draft is Ready`,
        html: emailHtml,
      });
    }

    return NextResponse.json({
      success: true,
      newsletterId: newsletter.id,
      message: `Newsletter draft for ${MONTH_NAMES[month - 1]} ${year} generated successfully`,
    });
  } catch (error: any) {
    console.error("Newsletter generation error:", error);
    return NextResponse.json(
      { error: error.message || "Generation failed" },
      { status: 500 },
    );
  }
}
