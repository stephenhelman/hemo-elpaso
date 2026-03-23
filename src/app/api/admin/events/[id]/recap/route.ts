import { NextRequest, NextResponse } from "next/server";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminWithPermissions();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!admin.can("canManageEvents"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const body = await request.json();
  const { recapTitleEn, recapTitleEs, recapBodyEn, recapBodyEs, recapGalleryEmbedUrl, publish } =
    body;

  const updated = await prisma.event.update({
    where: { id: params.id },
    data: {
      recapTitleEn: recapTitleEn ?? null,
      recapTitleEs: recapTitleEs ?? null,
      recapBodyEn: recapBodyEn ?? null,
      recapBodyEs: recapBodyEs ?? null,
      recapGalleryEmbedUrl: recapGalleryEmbedUrl ?? null,
      recapPublishedAt: publish
        ? (event.recapPublishedAt ?? new Date())
        : null,
    },
  });

  return NextResponse.json({ success: true, recapPublishedAt: updated.recapPublishedAt });
}
