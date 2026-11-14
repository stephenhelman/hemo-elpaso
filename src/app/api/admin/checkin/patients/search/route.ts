import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const { admin, error } = await requirePermission("canViewPHI");
    if (error) return error;

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
            contactProfile: {
              firstName: { contains: query, mode: "insensitive" },
            },
          },
          {
            contactProfile: {
              lastName: { contains: query, mode: "insensitive" },
            },
          },
        ],
      },
      include: {
        contactProfile: {
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
