import { cleanSponsorIds } from "@/lib/events/sponsor-ids";
import { eventRequestSettings, virtualLinksMissing } from "@/lib/rsvp/event-settings";
import { isFeatureEnabled } from "@/lib/features";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { AuditAction } from "@prisma/client";
import { generateInvitations } from "@/lib/invitations/generate";
import { eventTextFields } from "@/lib/events/text-fields";
import { cleanAgeGroups } from "@/lib/households/constants";

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
  if (body.endDate && new Date(body.endDate) <= new Date(body.eventDate)) {
    return NextResponse.json({ error: "The end must be after the start" }, { status: 400 });
  }

  const text = eventTextFields(body);
  if (!text.ok) return NextResponse.json({ error: text.error }, { status: 400 });

  const settings = eventRequestSettings(body, { recordingsOn: await isFeatureEnabled("recordings") });
  if (!settings.ok) return NextResponse.json({ error: settings.error }, { status: 400 });
  if (virtualLinksMissing({ virtualEnabled: settings.data.virtualEnabled ?? false, meetUrl: settings.data.meetUrl ?? null, youtubeUrl: settings.data.youtubeUrl ?? null })) {
    return NextResponse.json({ error: "Add both the Google Meet link and the YouTube link before turning on virtual attendance." }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      slug: body.slug,
      ...text.data,
      eventDate: new Date(body.eventDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      location: body.location,
      maxCapacity: body.maxCapacity || null,
      rsvpDeadline: body.rsvpDeadline ? new Date(body.rsvpDeadline) : null,
      status: body.status || "draft",
      category: body.category || "FAMILY_SUPPORT",
      targetAudience: body.targetAudience || "all",
      language: body.language || "both",
      isPriority: body.isPriority || false,
      liveEnabled: body.liveEnabled || false,
      ...settings.data,
      isRecorded: body.isRecorded === true,
      createdBy: admin!.email,
      sponsorSanityIds: cleanSponsorIds(body.sponsorSanityIds) ?? [],
      targeting: {
        create: {
          targetConditions: Array.isArray(body.targetConditions) ? body.targetConditions : [],
          targetSeverity: Array.isArray(body.targetSeverity) ? body.targetSeverity : [],
          targetAgeGroups: cleanAgeGroups(body.targetAgeGroups) ?? [],
          targetInterests: [],
        },
      },
    },
  });

  // Published events get PENDING invitations for matching patients (nothing is sent).
  if (event.status === "published") {
    await generateInvitations(event.id, { trigger: "publish", byBoardUserId: admin!.id }).catch(() => undefined);
  }

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
