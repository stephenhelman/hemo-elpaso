import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { BOARD_ONLY } from "@/lib/patients/query";

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
      AND: [BOARD_ONLY, { OR: [
        { email: { contains: query, mode: "insensitive" } },
        {
          contactProfile: {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
            ],
          },
        },
      ] }],
      // Only board-only records (no household data): the settings-only admin never sees family records. A board
      // member whose record was linked to a household is handled by the President/VP. Use "Invite board member"
      // for new people.
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
