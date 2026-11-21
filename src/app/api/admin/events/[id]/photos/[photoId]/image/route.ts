import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { getR2Buffer } from "@/lib/r2";

export const dynamic = "force-dynamic";

/**
 * Authenticated image for the admin photo grid (?size=thumb|main). Photos that are NOT approved are shown through
 * this route so their storage URL never has to be opened by a browser: pending photos (people who may not have
 * consented) are not linked from anywhere public. Same permission as the admin photo list.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string; photoId: string } }) {
  const { error } = await requirePermission("canViewAdminDashboard");
  if (error) return error;

  const photo = await prisma.eventPhoto.findFirst({
    where: { id: params.photoId, eventId: params.id },
    select: { key: true, thumbKey: true },
  });
  if (!photo) return new NextResponse(null, { status: 404 });

  const key = req.nextUrl.searchParams.get("size") === "main" ? photo.key : (photo.thumbKey ?? photo.key);
  try {
    const buf = await getR2Buffer(key);
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=300", "Referrer-Policy": "no-referrer" },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
