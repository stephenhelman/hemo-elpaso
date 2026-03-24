import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    select: { id: true, titleEn: true, titleEs: true, eventDate: true, location: true },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}
