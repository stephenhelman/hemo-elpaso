import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

interface Props {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Props) {
  const { error } = await requirePermission("canManageMinutes");
  if (error) return error;

  const minutes = await prisma.boardMinutes.findUnique({
    where: { id: params.id },
  });

  if (!minutes) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ minutes });
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { admin, error } = await requirePermission("canManageMinutes");
  if (error) return error;

  const body = await req.json();
  const { title, content, isPublic } = body;

  // Only users with canMarkMinutesPublic can toggle visibility
  if (typeof isPublic === "boolean" && !admin!.can("canMarkMinutesPublic")) {
    return NextResponse.json(
      { error: "Only the Secretary can change minutes visibility" },
      { status: 403 },
    );
  }

  const minutes = await prisma.boardMinutes.findUnique({
    where: { id: params.id },
  });

  if (!minutes) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.boardMinutes.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      ...(content && { content }),
      ...(typeof isPublic === "boolean" && {
        isPublic,
        markedPublicBy: isPublic ? admin!.email : null,
        markedPublicAt: isPublic ? new Date() : null,
      }),
    },
  });

  if (typeof isPublic === "boolean") {
    await prisma.auditLog.create({
      data: {
        patientId: admin!.id,
        action: AuditAction.BOARD_MINUTES_VISIBILITY_CHANGED,
        resourceType: "BoardMinutes",
        resourceId: params.id,
        details: `Board minutes "${minutes.title}" marked ${isPublic ? "public" : "private"} by ${admin!.email}`,
      },
    });
  }

  return NextResponse.json({ minutes: updated });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const { error } = await requirePermission("canManageMinutes");
  if (error) return error;

  const minutes = await prisma.boardMinutes.findUnique({
    where: { id: params.id },
  });

  if (!minutes) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.boardMinutes.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
