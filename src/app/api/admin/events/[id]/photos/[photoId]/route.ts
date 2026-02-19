import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { deleteFromR2 } from "@/lib/r2";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } },
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

    const photo = await prisma.eventPhoto.findUnique({
      where: { id: params.photoId },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Delete from R2
    await deleteFromR2(photo.key);

    // Delete from database
    await prisma.eventPhoto.delete({
      where: { id: params.photoId },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: "event_photo_deleted",
        resourceType: "EventPhoto",
        resourceId: params.photoId,
        details: `Deleted event photo`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Photo deletion error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
