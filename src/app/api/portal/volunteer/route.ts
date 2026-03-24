import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await prisma.patient.findUnique({ where: { auth0Id: session.user.sub } });
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const profile = await prisma.volunteerProfile.findUnique({
    where: { patientId: patient.id },
    include: {
      applications: { orderBy: { submittedAt: "desc" }, take: 1 },
      eventAssignments: {
        include: {
          event: {
            select: {
              id: true,
              titleEn: true,
              titleEs: true,
              eventDate: true,
              location: true,
              slug: true,
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      },
      timecards: {
        include: { event: { select: { titleEn: true, titleEs: true } } },
        orderBy: { checkInTime: "desc" },
      },
    },
  });

  return NextResponse.json({ profile });
}
