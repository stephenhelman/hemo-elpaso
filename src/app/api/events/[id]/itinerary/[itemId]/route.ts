import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } },
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
    const { status } = body;

    const item = await prisma.eventItineraryItem.update({
      where: { id: params.itemId },
      data: { status },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: "itinerary_item_updated",
        resourceType: "EventItineraryItem",
        resourceId: params.itemId,
        details: `Updated itinerary item status to: ${status}`,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Itinerary update error:", error);
    return NextResponse.json(
      { error: "Failed to update itinerary item" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } },
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

    const item = await prisma.eventItineraryItem.findUnique({
      where: { id: params.itemId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.eventItineraryItem.delete({
      where: { id: params.itemId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: "itinerary_item_deleted",
        resourceType: "EventItineraryItem",
        resourceId: params.itemId,
        details: `Deleted itinerary item: ${item.titleEn}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Itinerary deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete itinerary item" },
      { status: 500 },
    );
  }
}
