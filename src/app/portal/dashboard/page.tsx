import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getRecommendedEvents } from "@/lib/event-matching";

import { PortalDashboardContent } from "@/components/portal/dashboard/DashboardContent";
import LiveEventBanner from "@/components/portal/LiveEventBanner";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  // Look up patient by Auth0 ID
  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: {
      contactProfile: true,
      disorderProfile: true,
      preferences: true,
      rsvps: {
        include: {
          event: true,
        },
        where: {
          event: {
            eventDate: {
              gte: new Date(),
            },
          },
        },
        orderBy: {
          event: {
            eventDate: "asc",
          },
        },
        take: 3,
      },
      checkIns: {
        include: {
          event: true,
        },
      },
    },
  });

  // If no patient record, redirect to registration
  if (!patient || !patient.contactProfile) {
    redirect("/register");
  }

  // Get recommended events
  const recommendedMatches = await getRecommendedEvents(patient.id, 3);
  const recommendedEventIds = recommendedMatches.map((m) => m.eventId);

  const recommendedEvents = await prisma.event.findMany({
    where: {
      id: { in: recommendedEventIds },
    },
  });

  // Match events with their scores and reasons

  // Get recent activity
  const recentActivity = await prisma.auditLog.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <PortalDashboardContent
      patient={patient}
      recommendedMatches={recommendedMatches}
      recentActivity={recentActivity}
      recommendedEvents={recommendedEvents}
      liveEventBanner={
        <LiveEventBanner
          patientId={patient.id}
          locale={(patient.preferredLanguage as "en" | "es") || "en"}
        />
      }
    />
  );
}
