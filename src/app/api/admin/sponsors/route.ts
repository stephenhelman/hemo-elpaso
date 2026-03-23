import { NextRequest, NextResponse } from "next/server";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function GET() {
  const admin = await getAdminWithPermissions();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sponsors = await prisma.sponsor.findMany({
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    include: { _count: { select: { events: true } } },
  });

  return NextResponse.json(sponsors);
}

export async function POST(request: NextRequest) {
  const admin = await getAdminWithPermissions();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!admin.can("canManageEvents"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, tier, website } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const sponsor = await prisma.sponsor.create({
    data: { name: name.trim(), tier: tier ?? "PARTNER", website: website?.trim() || null },
  });

  return NextResponse.json(sponsor, { status: 201 });
}
