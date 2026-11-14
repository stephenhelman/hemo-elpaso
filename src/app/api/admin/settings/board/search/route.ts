import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission("canAssignBoardRoles");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ patients: [] });
  }

  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        {
          contactProfile: {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
            ],
          },
        },
      ],
      // Only staff rows: board/admin, or anyone who already has an Auth0 login
      // (e.g. a former board member). Public patients are never assignable here;
      // use "Invite board member" for new people.
      AND: [{ OR: [{ role: { in: ["board", "admin"] } }, { auth0Id: { not: null } }] }],
    },
    include: { contactProfile: true },
    take: 10,
  });

  return NextResponse.json({
    patients: patients.map((p) => ({
      id: p.id,
      email: p.email,
      firstName: p.contactProfile?.firstName ?? null,
      lastName: p.contactProfile?.lastName ?? null,
    })),
  });
}
