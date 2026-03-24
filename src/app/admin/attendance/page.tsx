import { prisma } from "@/lib/db";
import { getAdminWithPermissions } from "@/lib/permissions";
import { redirect } from "next/navigation";
import AllAttendeesTable from "@/components/admin/AllAttendeesTable";
import { Calendar, Users, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Lang } from "@/types";
import { adminAttendanceTranslation, adminAttendanceTableTranslation } from "@/translation/adminPages";
import { getLocaleCookie } from "@/lib/locale";

export default async function AllAttendeesPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canViewEventStats")) redirect("/admin/dashboard");

  const locale = (await getLocaleCookie()) as Lang;
  const t = adminAttendanceTranslation[locale];
  const tTable = adminAttendanceTableTranslation[locale];

  // Get all check-ins with related data
  const checkIns = await prisma.checkIn.findMany({
    include: {
      event: { select: { id: true, titleEn: true, eventDate: true } },
      patient: { select: { id: true, email: true, contactProfile: { select: { firstName: true, lastName: true, phone: true } } } },
    },
    orderBy: {
      checkInTime: "desc",
    },
  });

  // Total volunteer hours from timecards
  const timecards = await prisma.volunteerTimecard.findMany({
    where: { checkOutTime: { not: null } },
    select: { totalHours: true },
  });
  const totalVolunteerHours = timecards.reduce((sum, tc) => sum + (Number(tc.totalHours) || 0), 0);

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
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AllAttendeesTable checkIns={checkIns as any} events={events} locale={locale}>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            label={tTable.volunteerHours}
            value={totalVolunteerHours.toFixed(1)}
            color="teal"
            subtitle={tTable.totalVolunteerHours}
          />
        </div>
      </AllAttendeesTable>
    </div>
  );
}
