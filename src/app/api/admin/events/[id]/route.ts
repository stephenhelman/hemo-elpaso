import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { AuditAction } from "@prisma/client";
import { generateInvitations } from "@/lib/invitations/generate";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) return error;

    const body = await request.json();
    if (body.endDate && new Date(body.endDate) <= new Date(body.eventDate)) {
      return NextResponse.json({ error: "The end must be after the start" }, { status: 400 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: {
        titleEn: body.titleEn,
        titleEs: body.titleEs,
        descriptionEn: body.descriptionEn || null,
        descriptionEs: body.descriptionEs || null,
        eventDate: new Date(body.eventDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        location: body.location,
        maxCapacity: body.maxCapacity || null,
        rsvpDeadline: body.rsvpDeadline ? new Date(body.rsvpDeadline) : null,
        status: body.status,
        category: body.category,
        targetAudience: body.targetAudience,
        language: body.language,
        isPriority: body.isPriority,
        liveEnabled: body.liveEnabled,
        ...(body.registrationEnabled !== undefined && { registrationEnabled: body.registrationEnabled === true }),
        ...(body.eventCost !== undefined && { eventCost: body.eventCost }),
      },
    });

    // Targeting is only touched when the form sends it.
    if (Array.isArray(body.targetConditions)) {
      await prisma.eventTargeting.upsert({
        where: { eventId: updatedEvent.id },
        update: { targetConditions: body.targetConditions },
        create: {
          eventId: updatedEvent.id,
          targetConditions: body.targetConditions,
          targetSeverity: [],
          targetAgeGroups: [],
          targetInterests: [],
        },
      });
    }

    // Re-run matching after edits: adds new matches as pending, never re-sends.
    if (updatedEvent.status === "published") {
      await generateInvitations(updatedEvent.id).catch(() => undefined);
    }

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
