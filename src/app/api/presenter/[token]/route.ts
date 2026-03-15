import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Props {
  params: { token: string };
}

export async function GET(req: NextRequest, { params }: Props) {
  const presenterToken = await prisma.presenterAccessToken.findUnique({
    where: { token: params.token },
    include: {
      event: {
        include: {
          presentation: true,
          itineraryItems: { orderBy: { sequenceOrder: "asc" } },
          announcements: { orderBy: { createdAt: "desc" } },
          polls: {
            include: {
              options: true,
              responses: true,
            },
            orderBy: { createdAt: "asc" },
          },
          questions: {
            orderBy: [{ upvotes: "desc" }, { createdAt: "asc" }],
          },
          photos: {
            where: { approved: false, source: "live" },
            orderBy: { uploadedAt: "desc" },
          },
        },
      },
    },
  });

  if (!presenterToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  if (presenterToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 410 });
  }

  return NextResponse.json({ presenterToken });
}
