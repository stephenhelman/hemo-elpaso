import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { AuditAction } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) return error;

    const body = await request.json();

    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: {
        titleEn: body.titleEn,
        titleEs: body.titleEs,
        descriptionEn: body.descriptionEn || null,
        descriptionEs: body.descriptionEs || null,
        eventDate: new Date(body.eventDate),
        location: body.location,
        maxCapacity: body.maxCapacity || null,
        rsvpDeadline: body.rsvpDeadline ? new Date(body.rsvpDeadline) : null,
        status: body.status,
        category: body.category,
        targetAudience: body.targetAudience,
        language: body.language,
        isPriority: body.isPriority,
        liveEnabled: body.liveEnabled,
        ...(body.eventCost !== undefined && { eventCost: body.eventCost }),
      },
    });

    await prisma.auditLog.create({
      data: {
        patientId: admin!.id,
        action: AuditAction.EVENT_UPDATED,
        resourceType: "Event",
        resourceId: updatedEvent.id,
        details: `Updated event: ${updatedEvent.titleEn}`,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Event update error:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) return error;

    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.event.delete({ where: { id: params.id } });

    await prisma.auditLog.create({
      data: {
        patientId: admin!.id,
        action: AuditAction.EVENT_DELETED,
        resourceType: "Event",
        resourceId: params.id,
        details: `Deleted event: ${event.titleEn}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Event delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 },
    );
  }
}
