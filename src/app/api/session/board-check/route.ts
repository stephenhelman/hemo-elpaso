import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Used by middleware.ts (Edge, no Prisma) to verify the caller's Patient
 * record has role board/admin. Reports only on the caller's own session.
 * Returns an empty body — no data is exposed.
 */
export async function GET() {
  const session = await getSession();
  if (!session?.user) return new NextResponse(null, { status: 401 });

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    select: { role: true },
  });

  if (!patient || !["board", "admin"].includes(patient.role)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 200 });
}
