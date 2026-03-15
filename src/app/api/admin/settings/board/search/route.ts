import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
      registrationCompletedAt: { not: null },
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
