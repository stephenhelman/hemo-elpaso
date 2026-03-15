import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { AuditAction } from "@prisma/client";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;

  const { eventId, presenterName, expiresInHours = 12 } = await req.json();

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  const presenterToken = await prisma.presenterAccessToken.create({
    data: {
      eventId,
      token,
      presenterName: presenterName || null,
      expiresAt,
      createdBy: admin!.email,
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.PRESENTER_TOKEN_CREATED,
      resourceType: "PresenterAccessToken",
      resourceId: presenterToken.id,
      details: `Presenter token created for event ${event.titleEn}${presenterName ? ` — ${presenterName}` : ""}`,
    },
  });

  const presenterUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/presenter/${token}`;

  return NextResponse.json({
    presenterToken,
    presenterUrl,
  });
}
