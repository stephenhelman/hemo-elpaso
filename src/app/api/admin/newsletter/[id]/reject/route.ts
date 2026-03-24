import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { render } from "@react-email/render";
import { AuditAction } from "@prisma/client";
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
        { error: `Cannot reject newsletter with status: ${newsletter.status}` },
        { status: 400 },
      );
    }

    const { revisionNotes } = await req.json();

    if (!revisionNotes?.trim()) {
      return NextResponse.json(
        { error: "Revision notes are required" },
        { status: 400 },
      );
    }

    // Update status
    const updated = await prisma.newsletter.update({
      where: { id: params.id },
      data: {
        status: "CHANGES_REQUESTED",
        revisionNotes,
      },
    });

    // Notify Communications Liaison if one exists
    const liaisonRole = await prisma.boardRole.findFirst({
      where: { role: "COMMUNICATIONS_LEAD", active: true },
      include: { patient: { include: { contactProfile: true } } },
    });

    if (liaisonRole) {
      const monthName = MONTH_NAMES[newsletter.month - 1];
      const previewUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/newsletter/${newsletter.id}`;
      const firstName =
        liaisonRole.patient.contactProfile?.firstName || "Communications Lead";

      // Reuse the draft ready email with isRevision flag
      const emailHtml = render(
        NewsletterDraftReady({
          presidentName: firstName,
          month: monthName,
          year: newsletter.year,
          eventCount:
            (newsletter.generatedContentJson as any)?.eventRecaps?.length ?? 0,
          upcomingCount:
            (newsletter.generatedContentJson as any)?.upcomingEvents?.length ??
            0,
          previewUrl,
          isRevision: false, // This is a rejection notice, not a resubmit
          revisionNotes,
        }),
      );

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "HOEP <noreply@hemo-el-paso.org>",
        to: liaisonRole.patient.email,
        subject: `📝 Newsletter Changes Requested — ${monthName} ${newsletter.year}`,
        html: emailHtml,
      });
    }

    await prisma.auditLog.create({
      data: {
        patientId: admin!.id,
        action: AuditAction.NEWSLETTER_REJECTED,
        resourceType: "Newsletter",
        resourceId: params.id,
        details: `Newsletter changes requested by President. Notes: ${revisionNotes}`,
      },
    });

    return NextResponse.json({ success: true, newsletter: updated });
  } catch (error: any) {
    console.error("Newsletter reject error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to request changes" },
      { status: 500 },
    );
  }
}
