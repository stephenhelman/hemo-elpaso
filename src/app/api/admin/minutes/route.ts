import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission("canManageMinutes");
  if (error) return error;

  const minutes = await prisma.boardMinutes.findMany({
    orderBy: { meetingDate: "desc" },
  });

  return NextResponse.json({ minutes });
}

export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageMinutes");
  if (error) return error;

  const { title, meetingDate, content } = await req.json();

  if (!title?.trim() || !meetingDate || !content?.sections?.length) {
    return NextResponse.json(
      { error: "title, meetingDate, and content are required" },
      { status: 400 },
    );
  }

  const minutes = await prisma.boardMinutes.create({
    data: {
      title,
      meetingDate: new Date(meetingDate),
      content,
      uploadedBy: admin!.email,
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.BOARD_MINUTES_UPLOADED,
      resourceType: "BoardMinutes",
      resourceId: minutes.id,
      details: `Board minutes created: ${title}`,
    },
  });

  return NextResponse.json({ minutes }, { status: 201 });
}
