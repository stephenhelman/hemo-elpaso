import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Props {
  params: { token: string; photoId: string };
}

async function verifyPresenterToken(token: string) {
  const presenterToken = await prisma.presenterAccessToken.findUnique({
    where: { token },
  });
  if (!presenterToken || presenterToken.expiresAt < new Date()) return null;
  return presenterToken;
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const presenterToken = await verifyPresenterToken(params.token);
  if (!presenterToken) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }

  const { approved } = await req.json();

  const photo = await prisma.eventPhoto.findFirst({
    where: {
      id: params.photoId,
      eventId: presenterToken.eventId,
    },
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const updated = await prisma.eventPhoto.update({
    where: { id: params.photoId },
    data: { approved },
  });

  return NextResponse.json({ photo: updated });
}
