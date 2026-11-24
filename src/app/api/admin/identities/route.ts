import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** President/VP (canManageUsers): sign-ins that are not linked to anyone yet, with how many households match their email. */
export async function GET() {
  const { error } = await requirePermission("canManageUsers");
  if (error) return error;
  const rows = await prisma.userIdentity.findMany({ where: { patientId: null }, orderBy: { lastLoginAt: "desc" }, take: 200 });
  const out = await Promise.all(
    rows.map(async (r) => ({
      id: r.id, provider: r.provider, email: r.email, lastLoginAt: r.lastLoginAt.toISOString(), unlinkedByHand: r.linkedVia === "unlinked",
      matches: await prisma.patient.count({ where: { email: { equals: r.email, mode: "insensitive" } } }),
    })),
  );
  return NextResponse.json({ identities: out });
}
