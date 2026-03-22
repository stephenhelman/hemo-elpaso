import { NextRequest, NextResponse } from "next/server";
import { createNewsletterDraft } from "@/lib/newsletter-generator";
import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { render } from "@react-email/render";
import NewsletterDraftReady from "@/messages/NewsletterDraftReady";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate for the previous month
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = targetDate.getMonth() + 1; // 1-based
    const year = targetDate.getFullYear();

    const { newsletter, alreadyExists } = await createNewsletterDraft(
      month,
      year,
      "cron",
    );

    if (alreadyExists) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: `Newsletter for ${MONTH_NAMES[month - 1]} ${year} already exists`,
        newsletterId: newsletter.id,
      });
    }

    // Notify the President
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
      message: `Newsletter draft for ${MONTH_NAMES[month - 1]} ${year} generated`,
    });
  } catch (error) {
    console.error("Newsletter cron error:", error);
    return NextResponse.json(
      {
        error: "Cron job failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
