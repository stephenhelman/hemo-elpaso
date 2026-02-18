import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
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
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: "event_updated",
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

    // Get event details for audit log
    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Delete event (cascades to related records via Prisma schema)
    await prisma.event.delete({
      where: { id: params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: "event_deleted",
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
