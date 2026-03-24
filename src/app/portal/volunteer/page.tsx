import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import VolunteerPortalContent from "@/components/portal/VolunteerPortalContent";

export default async function VolunteerPortalPage() {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");

  const patient = await prisma.patient.findUnique({ where: { auth0Id: session.user.sub } });
  if (!patient) redirect("/portal/dashboard");

  const locale = (await getLocaleCookie()) as Lang;

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

  if (!profile) redirect("/portal/dashboard");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <VolunteerPortalContent profile={profile as any} locale={locale} />
    </div>
  );
}
