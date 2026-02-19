import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ patients: [] });
    }

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          {
            profile: {
              firstName: { contains: query, mode: "insensitive" },
            },
          },
          {
            profile: {
              lastName: { contains: query, mode: "insensitive" },
            },
          },
        ],
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      take: 10,
    });

    return NextResponse.json({ patients });
  } catch (error) {
    console.error("Patient search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
