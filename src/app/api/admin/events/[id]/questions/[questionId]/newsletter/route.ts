import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

interface Props {
  params: { id: string; pollId: string };
}

export async function PATCH(req: NextRequest, { params }: Props) {
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

  const { selected } = await req.json();

  const poll = await prisma.poll.update({
    where: { id: params.pollId },
    data: { selectedForNewsletter: selected },
  });

  return NextResponse.json({ poll });
}
