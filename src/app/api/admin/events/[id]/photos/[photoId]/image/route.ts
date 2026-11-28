import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { adminImageUrl } from "@/lib/photos/download";
import { storageUnavailable } from "@/lib/storage-response";

export const dynamic = "force-dynamic";

/**
 * An image for the admin photo grid (?size=thumb|main): checks the permission, then redirects to a presigned address
 * that expires in two minutes. This is how photos that are NOT approved are seen: never through the public domain.
 * Same permission as the admin photo list.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string; photoId: string } }) {
  const { error } = await requirePermission("canViewAdminDashboard");
  if (error) return error;
  const down = storageUnavailable("photo image");
  if (down) return down;

  const photo = await prisma.eventPhoto.findFirst({
    where: { id: params.photoId, eventId: params.id },
    select: { key: true, thumbKey: true },
  });
  if (!photo) return new NextResponse(null, { status: 404 });

  const key = req.nextUrl.searchParams.get("size") === "main" ? photo.key : (photo.thumbKey ?? photo.key);
  return new NextResponse(null, {
    status: 302,
    headers: { Location: await adminImageUrl(key), "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
}
