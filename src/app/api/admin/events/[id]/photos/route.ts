import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

/** Admin listing (all photos, approved or not). The upload itself is presign -> PUT to R2 -> process. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requirePermission("canViewAdminDashboard");
    if (error) return error;

    const photos = await prisma.eventPhoto.findMany({
      where: { eventId: params.id },
      orderBy: [{ sortOrder: "asc" }, { uploadedAt: "asc" }],
    });
    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Photos fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}
