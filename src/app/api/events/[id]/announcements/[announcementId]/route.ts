import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; announcementId: string } },
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

    const announcement = await prisma.eventAnnouncement.findUnique({
      where: { id: params.announcementId },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 },
      );
    }

    // Soft delete by marking inactive
    await prisma.eventAnnouncement.update({
      where: { id: params.announcementId },
      data: { active: false },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: "announcement_deleted",
        resourceType: "EventAnnouncement",
        resourceId: params.announcementId,
        details: `Removed announcement: ${announcement.messageEn.substring(0, 50)}...`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Announcement deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 },
    );
  }
}
