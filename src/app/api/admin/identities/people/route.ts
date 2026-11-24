import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { HOUSEHOLD_EVIDENCE } from "@/lib/patients/query";

export const dynamic = "force-dynamic";

/**
 * President/VP (canManageUsers): find people to link a sign-in to or to merge, INCLUDING board-only records (the
 * patient search deliberately hides those). Names, email, flags and sign-in providers only: no diagnoses, no phone.
 */
export async function GET(req: NextRequest) {
  const { error } = await requirePermission("canManageUsers");
  if (error) return error;
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ people: [] });

  const rows = await prisma.patient.findMany({
    where: {
      role: { notIn: ["admin", "merged"] },
      mergedIntoId: null,
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { contactProfile: { firstName: { contains: q, mode: "insensitive" } } },
        { contactProfile: { lastName: { contains: q, mode: "insensitive" } } },
      ],
    },
    select: {
      id: true, email: true, role: true, createdAt: true,
      contactProfile: { select: { firstName: true, lastName: true } },
      boardRoles: { where: { active: true }, select: { role: true } },
      identities: { select: { id: true, provider: true, email: true, linkedVia: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  });
  const household = new Set((await prisma.patient.findMany({ where: { id: { in: rows.map((r) => r.id) }, ...HOUSEHOLD_EVIDENCE }, select: { id: true } })).map((r) => r.id));
  return NextResponse.json({
    people: rows.map((r) => ({
      id: r.id, name: `${r.contactProfile?.firstName ?? ""} ${r.contactProfile?.lastName ?? ""}`.trim() || "—", email: r.email,
      hasHousehold: household.has(r.id), boardRoles: r.boardRoles.map((b) => b.role), identities: r.identities,
    })),
  });
}
