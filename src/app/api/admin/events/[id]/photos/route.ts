import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { adminPhoto } from "@/lib/photos/admin-view";

/** Admin listing (all photos, approved or not). The upload itself is presign -> PUT to R2 -> process. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requirePermission("canViewAdminDashboard");
    if (error) return error;

    const photos = await prisma.eventPhoto.findMany({
      where: { eventId: params.id },
      orderBy: [{ sortOrder: "asc" }, { uploadedAt: "asc" }],
    });
    // no storage address for anything unapproved (lib/photos/admin-view.ts)
    return NextResponse.json({ photos: photos.map(adminPhoto) });
  } catch (error) {
    console.error("Photos fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}
