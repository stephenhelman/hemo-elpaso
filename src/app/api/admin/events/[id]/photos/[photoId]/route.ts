import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { deleteFromR2 } from "@/lib/r2";
import { AuditAction } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } },
) {
  try {
    const { error } = await requirePermission("canManageEvents");
    if (error) return error;

    const body = await request.json();
    const { approved } = body;

    if (typeof approved !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const photo = await prisma.eventPhoto.update({
      where: { id: params.photoId },
      data: { approved },
    });

    return NextResponse.json({ photo });
  } catch (error) {
    console.error("Photo update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } },
) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) return error;

    const photo = await prisma.eventPhoto.findUnique({
      where: { id: params.photoId },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    await deleteFromR2(photo.key);

    await prisma.eventPhoto.delete({
      where: { id: params.photoId },
    });

    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.EVENT_PHOTO_DELETED,
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
