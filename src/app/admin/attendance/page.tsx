import { prisma } from "@/lib/db";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import AllAttendeesTable from "@/components/admin/AllAttendeesTable";
import { Calendar, Users, TrendingUp, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { cookies } from "next/headers";
import { Lang } from "@/types";
import { adminAttendanceTranslation } from "@/translation/adminPages";

export default async function AllAttendeesPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  // Check if user is admin/board
  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

  const locale = ((await cookies()).get("locale")?.value as Lang) || "en";
  const t = adminAttendanceTranslation[locale];

  // Get all check-ins with related data
  const checkIns = await prisma.checkIn.findMany({
    include: {
      event: true,
      patient: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: {
      checkInTime: "desc",
    },
  });

  // Get all events for filter dropdown
  const events = await prisma.event.findMany({
    orderBy: {
      eventDate: "desc",
    },
    select: {
      id: true,
      titleEn: true,
      eventDate: true,
    },
  });

  // Calculate stats
  const totalCheckIns = checkIns.length;
  const uniqueAttendees = new Set(checkIns.map((c) => c.patientId)).size;
  const eventsWithAttendance = new Set(checkIns.map((c) => c.eventId)).size;

  // Calculate average attendance per event
  const avgAttendance =
    eventsWithAttendance > 0
      ? Math.round(totalCheckIns / eventsWithAttendance)
      : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
          {t.heading}
        </h1>
        <p className="text-neutral-500">{t.subtitle}</p>
      </div>

      {/* Table */}
      <AllAttendeesTable checkIns={checkIns} events={events}>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label={t.totalCheckIns}
            value={totalCheckIns.toString()}
            color="primary"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label={t.uniqueFamilies}
            value={uniqueAttendees.toString()}
            color="blue"
          />
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            label={t.eventsWithAttendance}
            value={eventsWithAttendance.toString()}
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label={t.avgPerEvent}
            value={avgAttendance.toString()}
            color="purple"
          />
        </div>
      </AllAttendeesTable>
    </div>
  );
}
