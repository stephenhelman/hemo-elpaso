import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { AuditAction } from "@prisma/client";

export async function GET() {
  const { admin, error } = await requirePermission("canViewAdminDashboard");
  if (error) return error;

  const events = await prisma.event.findMany({
    orderBy: { eventDate: "desc" },
    include: { targeting: true },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;

  const body = await req.json();

  const event = await prisma.event.create({
    data: {
      slug: body.slug,
      titleEn: body.titleEn,
      titleEs: body.titleEs,
      descriptionEn: body.descriptionEn || null,
      descriptionEs: body.descriptionEs || null,
      eventDate: new Date(body.eventDate),
      location: body.location,
      maxCapacity: body.maxCapacity || null,
      rsvpDeadline: body.rsvpDeadline ? new Date(body.rsvpDeadline) : null,
      status: body.status || "draft",
      category: body.category || "FAMILY_SUPPORT",
      targetAudience: body.targetAudience || "all",
      language: body.language || "both",
      isPriority: body.isPriority || false,
      liveEnabled: body.liveEnabled || false,
      createdBy: admin!.email,
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.EVENT_CREATED,
      resourceType: "Event",
      resourceId: event.id,
      details: `Created event: ${event.titleEn}`,
    },
  });

  revalidatePath("/admin/events");
  return NextResponse.json(event, { status: 201 });
}
