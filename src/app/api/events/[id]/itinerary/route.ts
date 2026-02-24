import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();

    // Allow both authenticated users and sponsor session tokens
    const { searchParams } = new URL(request.url);
    const sponsorSession = searchParams.get("session");

    if (!session?.user && !sponsorSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get itinerary items
    const items = await prisma.eventItineraryItem.findMany({
      where: {
        eventId: params.id,
      },
      orderBy: {
        sequenceOrder: "asc",
      },
    });

    // Auto-update status based on current time
    const now = new Date();
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        const startTime = new Date(item.startTime);
        const endTime = item.endTime ? new Date(item.endTime) : null;

        let newStatus = item.status;

        // Only auto-update if currently scheduled
        if (item.status === "scheduled") {
          if (now >= startTime) {
            if (endTime && now >= endTime) {
              newStatus = "completed";
            } else {
              newStatus = "current";
            }

            // Update in database
            await prisma.eventItineraryItem.update({
              where: { id: item.id },
              data: { status: newStatus },
            });
          }
        }

        return { ...item, status: newStatus };
      }),
    );

    return NextResponse.json({ items: updatedItems });
  } catch (error) {
    console.error("Itinerary fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch itinerary" },
      { status: 500 },
    );
  }
}

export async function POST(
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
    const {
      titleEn,
      titleEs,
      descriptionEn,
      descriptionEs,
      startTime,
      duration,
      location,
      sequenceOrder,
    } = body;

    // Calculate end time if duration provided
    let endTime = null;
    if (duration) {
      endTime = new Date(new Date(startTime).getTime() + duration * 60 * 1000);
    }

    const item = await prisma.eventItineraryItem.create({
      data: {
        eventId: params.id,
        titleEn,
        titleEs,
        descriptionEn: descriptionEn || null,
        descriptionEs: descriptionEs || null,
        startTime: new Date(startTime),
        endTime,
        duration: duration || null,
        location: location || null,
        sequenceOrder: sequenceOrder || 0,
        createdBy: admin.email,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.ITINERARY_ITEM_CREATED,
        resourceType: "EventItineraryItem",
        resourceId: item.id,
        details: `Added itinerary item: ${titleEn}`,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Itinerary creation error:", error);
    return NextResponse.json(
      { error: "Failed to create itinerary item" },
      { status: 500 },
    );
  }
}
