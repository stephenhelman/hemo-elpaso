import { NextRequest, NextResponse } from "next/server";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { uploadImageToR2, deleteFromR2, generateFileKey } from "@/lib/r2";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!admin.can("canManageEvents"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sponsor = await prisma.sponsor.findUnique({ where: { id: params.id } });
  if (!sponsor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("logo") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Remove old logo if it exists
  if (sponsor.logoKey) {
    await deleteFromR2(sponsor.logoKey).catch(() => null);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateFileKey("sponsors/logos", file.name);
  const url = await uploadImageToR2(buffer, key, 400);

  const updated = await prisma.sponsor.update({
    where: { id: params.id },
    data: { logoUrl: url, logoKey: key },
  });

  return NextResponse.json({ logoUrl: updated.logoUrl });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!admin.can("canManageEvents"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sponsor = await prisma.sponsor.findUnique({ where: { id: params.id } });
  if (!sponsor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (sponsor.logoKey) {
    await deleteFromR2(sponsor.logoKey).catch(() => null);
    await prisma.sponsor.update({
      where: { id: params.id },
      data: { logoUrl: null, logoKey: null },
    });
  }

  return NextResponse.json({ success: true });
}
