import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

interface Props {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Props) {
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

  const minutes = await prisma.boardMinutes.findUnique({
    where: { id: params.id },
  });

  if (!minutes) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ minutes });
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: { boardRoles: true },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, isPublic } = body;

  // Only Secretary can toggle visibility
  if (typeof isPublic === "boolean") {
    const isSecretary = admin.boardRoles.some(
      (r) => r.role === "SECRETARY" && r.active,
    );

    if (!isSecretary && admin.role !== "admin") {
      return NextResponse.json(
        { error: "Only the Secretary can change minutes visibility" },
        { status: 403 },
      );
    }
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
        markedPublicBy: isPublic ? admin.email : null,
        markedPublicAt: isPublic ? new Date() : null,
      }),
    },
  });

  if (typeof isPublic === "boolean") {
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.BOARD_MINUTES_VISIBILITY_CHANGED,
        resourceType: "BoardMinutes",
        resourceId: params.id,
        details: `Board minutes "${minutes.title}" marked ${isPublic ? "public" : "private"} by ${admin.email}`,
      },
    });
  }

  return NextResponse.json({ minutes: updated });
}

export async function DELETE(req: NextRequest, { params }: Props) {
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

  const minutes = await prisma.boardMinutes.findUnique({
    where: { id: params.id },
  });

  if (!minutes) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.boardMinutes.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
