import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active announcements that haven't expired
    const announcements = await prisma.eventAnnouncement.findMany({
      where: {
        eventId: params.id,
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      orderBy: [
        { priority: "desc" }, // urgent first
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Announcements fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 },
    );
  }
}

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
    const { messageEn, messageEs, priority, expiresInMinutes } = body;

    // Calculate expiration if provided
    let expiresAt = null;
    if (expiresInMinutes) {
      expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    }

    const announcement = await prisma.eventAnnouncement.create({
      data: {
        eventId: params.id,
        messageEn,
        messageEs,
        priority: priority || "normal",
        expiresAt,
        createdBy: admin.email,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: "announcement_created",
        resourceType: "EventAnnouncement",
        resourceId: announcement.id,
        details: `Posted announcement: ${messageEn.substring(0, 50)}...`,
      },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error("Announcement creation error:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 },
    );
  }
}
