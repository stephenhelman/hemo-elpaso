import { NextRequest, NextResponse } from "next/server";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";

// GET current sponsors for an event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventSponsors = await prisma.eventSponsor.findMany({
    where: { eventId: params.id },
    include: { sponsor: true },
  });

  return NextResponse.json(eventSponsors.map((es) => es.sponsor));
}

// PUT replaces all sponsor associations for an event
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!admin.can("canManageEvents"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { sponsorIds } = await request.json() as { sponsorIds: string[] };

  // Replace all associations in a transaction
  await prisma.$transaction([
    prisma.eventSponsor.deleteMany({ where: { eventId: params.id } }),
    ...(sponsorIds ?? []).map((sponsorId: string) =>
      prisma.eventSponsor.create({ data: { eventId: params.id, sponsorId } }),
    ),
  ]);

  return NextResponse.json({ success: true });
}
