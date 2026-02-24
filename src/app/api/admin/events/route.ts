import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is board/admin
    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!patient || !["board", "admin"].includes(patient.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    console.log(body.slug);

    // Create event with targeting
    const event = await prisma.event.create({
      data: {
        slug: body.slug,
        titleEn: body.titleEn,
        titleEs: body.titleEs,
        descriptionEn: body.descriptionEn,
        descriptionEs: body.descriptionEs,
        eventDate: new Date(body.eventDate),
        location: body.location,
        maxCapacity: body.maxCapacity,
        rsvpDeadline: body.rsvpDeadline ? new Date(body.rsvpDeadline) : null,
        status: body.status,
        category: body.category,
        targetAudience: body.targetAudience,
        language: body.language,
        isPriority: body.isPriority,
        targeting: {
          create: {
            targetConditions: body.targetConditions || [],
            targetSeverity: body.targetSeverity || [],
            targetAgeGroups: body.targetAgeGroups || [],
            targetInterests: [],
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: AuditAction.EVENT_CREATED,
        resourceType: "Event",
        resourceId: event.id,
        details: `Created event: ${event.titleEn}`,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}
