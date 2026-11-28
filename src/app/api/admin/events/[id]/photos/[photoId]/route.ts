import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { deletePhotoObjects, moveToVisibility } from "@/lib/photos/service";
import { adminPhoto } from "@/lib/photos/admin-view";
import { storageUnavailable } from "@/lib/storage-response";
import { AuditAction } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_CAPTION = 300;
const cleanCaption = (v: unknown): string | null | undefined => {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, MAX_CAPTION);
  return t === "" ? null : t;
};

/**
 * Update one photo: approve/unapprove, captions (EN/ES), and cover.
 * Approving moves the files to a new public key; unapproving moves them back to a new private key, so the old
 * public URL stops working. A photo that is not approved can never be the cover.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string; photoId: string } }) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) return error;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    let photo = await prisma.eventPhoto.findFirst({ where: { id: params.photoId, eventId: params.id } });
    if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

    if (body.approved !== undefined && typeof body.approved !== "boolean") return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    if (body.cover !== undefined && typeof body.cover !== "boolean") return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id: params.id }, select: { coverPhotoId: true } });
    let coverPhotoId = event?.coverPhotoId ?? null;

    // approving or unapproving moves files: refuse before anything is written if storage can't be used
    if (typeof body.approved === "boolean" && body.approved !== photo.approved) {
      const down = storageUnavailable("photo approval");
      if (down) return down;
    }

    // captions
    const caption = cleanCaption(body.caption);
    const captionEs = cleanCaption(body.captionEs);
    if (caption !== undefined || captionEs !== undefined) {
      photo = await prisma.eventPhoto.update({
        where: { id: photo.id },
        data: { ...(caption !== undefined && { caption }), ...(captionEs !== undefined && { captionEs }) },
      });
    }

    // approval
    if (typeof body.approved === "boolean" && body.approved !== photo.approved) {
      // Move first, flip the flag after: the row is never "approved" while its files are still in the private area.
      if (body.approved) {
        photo = await moveToVisibility(photo, "public");
        photo = await prisma.eventPhoto.update({ where: { id: photo.id }, data: { approved: true } });
      } else {
        photo = await prisma.eventPhoto.update({ where: { id: photo.id }, data: { approved: false } });
        photo = await moveToVisibility(photo, "pending");
        if (coverPhotoId === photo.id) coverPhotoId = null; // an unapproved photo cannot be the cover
      }
      await prisma.auditLog.create({
        data: {
          patientId: admin!.id,
          action: AuditAction.EVENT_PHOTO_APPROVAL_CHANGED,
          resourceType: "EventPhoto",
          resourceId: photo.id,
          details: body.approved ? "Approved for the public gallery" : "Unapproved (removed from the public gallery)",
        },
      });
    }

    // cover
    if (body.cover === true) {
      if (!photo.approved) return NextResponse.json({ error: "Approve the photo before making it the cover" }, { status: 400 });
      coverPhotoId = photo.id;
    } else if (body.cover === false && coverPhotoId === photo.id) {
      coverPhotoId = null;
    }
    if (coverPhotoId !== (event?.coverPhotoId ?? null)) {
      await prisma.event.update({ where: { id: params.id }, data: { coverPhotoId } });
    }

    return NextResponse.json({ photo: adminPhoto(photo), coverPhotoId });
  } catch (error) {
    console.error("Photo update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; photoId: string } }) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) return error;

    const photo = await prisma.eventPhoto.findFirst({ where: { id: params.photoId, eventId: params.id } });
    if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

    const down = storageUnavailable("photo delete");
    if (down) return down;
    await deletePhotoObjects(photo); // both sizes
    await prisma.eventPhoto.delete({ where: { id: photo.id } });
    await prisma.event.updateMany({ where: { id: params.id, coverPhotoId: photo.id }, data: { coverPhotoId: null } });

    await prisma.auditLog.create({
      data: {
        patientId: admin!.id,
        action: AuditAction.EVENT_PHOTO_DELETED,
        resourceType: "EventPhoto",
        resourceId: params.photoId,
        details: "Deleted event photo",
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Photo deletion error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
