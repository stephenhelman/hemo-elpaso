import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function GET() {
  const { error } = await requirePermission("canManageVolunteers");
  if (error) return error;

  const volunteers = await prisma.volunteerProfile.findMany({
    include: {
      patient: {
        include: { contactProfile: true },
      },
      applications: { orderBy: { submittedAt: "desc" }, take: 1 },
      eventAssignments: {
        include: { event: { select: { id: true, titleEn: true, eventDate: true } } },
        orderBy: { assignedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ volunteers });
}
