import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function GET() {
  const { error } = await requirePermission("canManageUsers");
  if (error) return error;

  const approvals = await prisma.boardApproval.findMany({
    where: {
      type: "FAMILY_DETACHMENT",
      status: "PENDING",
    },
    orderBy: { requestedAt: "asc" },
  });

  // Enrich with membership + family data
  const enriched = await Promise.all(
    approvals.map(async (a) => {
      const membership = a.resourceId
        ? await prisma.familyMembership.findUnique({
            where: { id: a.resourceId },
            include: { family: { include: { primaryPatient: { include: { contactProfile: true } } } } },
          })
        : null;
      return { ...a, membership };
    })
  );

  return NextResponse.json({ approvals: enriched });
}
