import { NextRequest, NextResponse } from "next/server";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { deleteFromR2 } from "@/lib/r2";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!admin.can("canManageEvents"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, tier, website, isActive } = await request.json();

  const sponsor = await prisma.sponsor.update({
    where: { id: params.id },
    data: {
      name: name?.trim() ?? undefined,
      tier: tier ?? undefined,
      website: website?.trim() || null,
      isActive: isActive ?? undefined,
    },
  });

  return NextResponse.json(sponsor);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!admin.can("canManageEvents"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sponsor = await prisma.sponsor.findUnique({ where: { id: params.id } });
  if (!sponsor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Remove logo from R2 if it exists
  if (sponsor.logoKey) {
    await deleteFromR2(sponsor.logoKey).catch(() => null);
  }

  await prisma.sponsor.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
