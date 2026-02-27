import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import type { PollOption } from "@/types";

export async function POST(request: NextRequest) {
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
    const { eventId, questionEs, questionEn, options } = body;
    console.log(options);

    // Validate options
    if (!options || options.length < 2) {
      return NextResponse.json(
        { error: "Poll must have at least 2 options" },
        { status: 400 },
      );
    }

    // Create poll
    const poll = await prisma.poll.create({
      data: {
        eventId,
        questionEn,
        questionEs,
        options: {
          create: options.map((opt: PollOption) => ({
            textEn: opt.textEn,
            textEs: opt.textEs,
          })),
        },
        status: "approved",
        active: false,
        createdBy: admin.email,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.POLL_CREATED,
        resourceType: "Poll",
        resourceId: poll.id,
        details: `Created poll: ${questionEn}`,
      },
    });

    return NextResponse.json({ success: true, poll });
  } catch (error) {
    console.error("Poll creation error:", error);
    return NextResponse.json(
      { error: "Failed to create poll", message: error },
      { status: 500 },
    );
  }
}
