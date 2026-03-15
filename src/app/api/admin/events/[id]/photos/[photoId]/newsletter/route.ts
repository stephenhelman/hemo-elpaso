import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";

interface Props {
  params: { id: string; photoId: string };
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { error } = await requirePermission("canManageEvents");
  if (error) return error;

  const { selected } = await req.json();

  const photo = await prisma.eventPhoto.update({
    where: { id: params.photoId },
    data: { selectedForNewsletter: selected },
  });

  return NextResponse.json({ photo });
}
