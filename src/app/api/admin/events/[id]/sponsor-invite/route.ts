import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { AuditAction } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!admin || !["board", "admin"].includes(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { sponsorEmail, sponsorName, companyName } = body;

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Get event to include in expiration (day after event)
    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventDate = new Date(event.eventDate);
    const expiresAt = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours after event

    // Create token record
    await prisma.sponsorAccessToken.create({
      data: {
        eventId: params.id,
        token,
        sponsorEmail,
        sponsorName: sponsorName || null,
        companyName: companyName || null,
        expiresAt,
        createdBy: admin.email,
      },
    });

    // Generate link
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://hemo-el-paso.org";
    const link = `${baseUrl}/sponsor-access/${token}`;

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.SPONSOR_INVITE_SENT,
        resourceType: "SponsorAccessToken",
        resourceId: token,
        details: `Generated sponsor access link for ${sponsorEmail}`,
      },
    });

    return NextResponse.json({ success: true, link, token });
  } catch (error) {
    console.error("Sponsor invite error:", error);
    return NextResponse.json(
      { error: "Failed to generate invite" },
      { status: 500 },
    );
  }
}
