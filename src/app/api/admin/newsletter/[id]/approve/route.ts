import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { render } from "@react-email/render";
import { AuditAction } from "@prisma/client";

// We'll build the full member newsletter email template in Sprint 4
// For now this route handles the approve + send flow

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
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
      include: { boardRoles: true },
    });

    const isPresident = admin?.boardRoles.some(
      (r) => r.role === "PRESIDENT" && r.active,
    );

    if (!admin || (!isPresident && admin.role !== "admin")) {
      return NextResponse.json(
        { error: "Only the President can approve newsletters" },
        { status: 403 },
      );
    }

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

    // Update newsletter to SENT
    const updated = await prisma.newsletter.update({
      where: { id: params.id },
      data: {
        status: "SENT",
        presidentMessageEn,
        presidentMessageEs,
        sentAt: new Date(),
      },
    });

    // TODO Sprint 4: Send to all patients based on preferredLanguage
    // For now, just mark as sent and log

    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.NEWSLETTER_SENT,
        resourceType: "Newsletter",
        resourceId: params.id,
        details: `Newsletter ${MONTH_NAMES[newsletter.month - 1]} ${newsletter.year} approved and sent by President`,
      },
    });

    return NextResponse.json({ success: true, newsletter: updated });
  } catch (error: any) {
    console.error("Newsletter approve error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve newsletter" },
      { status: 500 },
    );
  }
}
