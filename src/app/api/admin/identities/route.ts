import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { candidatesForEmail } from "@/lib/identity/link";

export const dynamic = "force-dynamic";

/** President/VP (canManageUsers): sign-ins that are not linked to anyone yet, with how many people (primaries and confirmed adults) match their email. */
export async function GET() {
  const { error } = await requirePermission("canManageUsers");
  if (error) return error;
  const rows = await prisma.userIdentity.findMany({ where: { patientId: null }, orderBy: { lastLoginAt: "desc" }, take: 200 });
  const out = await Promise.all(
    rows.map(async (r) => ({
      id: r.id, provider: r.provider, email: r.email, lastLoginAt: r.lastLoginAt.toISOString(), unlinkedByHand: r.linkedVia === "unlinked",
      matches: (await candidatesForEmail(r.email)).length, // primaries, aliases and confirmed adults
    })),
  );
  return NextResponse.json({ identities: out });
}
