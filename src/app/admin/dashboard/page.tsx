import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { Users, Calendar, CheckCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Lang } from "@/types";
import { adminDashboardTranslation } from "@/translation/adminPages";
import { getLocaleCookie } from "@/lib/locale";

export default async function AdminDashboardPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canViewAdminDashboard")) redirect("/portal/dashboard");

  const adminProfile = await prisma.patient.findUnique({
    where: { id: admin.id },
    select: { contactProfile: { select: { firstName: true } } },
  });

  const locale = (await getLocaleCookie()) as Lang;
  const t = adminDashboardTranslation[locale as Lang];

  // Fetch dashboard data
  const now = new Date();

  // Total patients (excluding admin/board)
  const totalPatients = await prisma.patient.count({
    where: {
      role: "patient",
    },
  });

  // Total events
  const totalEvents = await prisma.event.count({
    where: {
      status: "published",
    },
  });

  // Upcoming events
  const upcomingEvents = await prisma.event.findMany({
    where: {
      status: "published",
      eventDate: {
        gte: now,
      },
    },
    orderBy: {
      eventDate: "asc",
    },
    take: 5,
    include: {
      _count: {
        select: {
          rsvps: true,
        },
      },
    },
  });

  // Recent RSVPs (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentRsvps = await prisma.rsvp.count({
    where: {
      rsvpDate: {
        gte: sevenDaysAgo,
      },
    },
  });

  // Calculate RSVP rate (for upcoming events)
  const upcomingEventsTotal = await prisma.event.count({
    where: {
      status: "published",
      eventDate: {
        gte: now,
      },
    },
  });

  const upcomingRsvps = await prisma.rsvp.count({
    where: {
      event: {
        eventDate: {
          gte: now,
        },
      },
    },
  });

  const rsvpRate =
    upcomingEventsTotal > 0 && totalPatients > 0
      ? Math.round(
          (upcomingRsvps / (upcomingEventsTotal * totalPatients)) * 100,
        )
      : 0;

  // Calculate attendance rate (past events)
  const pastEventsWithRsvps = await prisma.event.findMany({
    where: {
      status: "published",
      eventDate: {
        lt: now,
      },
    },
    include: {
      _count: {
        select: {
          rsvps: true,
          checkIns: {
            where: {
              attendeeRole: "patient", // Only count patients
            },
          },
        },
      },
    },
  });

  const totalPastRsvps = pastEventsWithRsvps.reduce(
    (sum, e) => sum + e._count.rsvps,
    0,
  );
  const totalPastCheckIns = pastEventsWithRsvps.reduce(
    (sum, e) => sum + e._count.checkIns,
    0,
  );
  const attendanceRate =
    totalPastRsvps > 0
      ? Math.round((totalPastCheckIns / totalPastRsvps) * 100)
      : 0;

  // Recent activity (last 10 RSVPs)
  const recentActivity = await prisma.rsvp.findMany({
    take: 10,
    orderBy: {
      rsvpDate: "desc",
    },
    include: {
      patient: {
        include: {
          contactProfile: true,
        },
      },
      event: true,
    },
  });

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
          {t.heading}
        </h1>
        <p className="text-neutral-600">
          {t.welcome(adminProfile?.contactProfile?.firstName || "Admin")}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/events/new"
          className="p-6 rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary hover:bg-primary-50 transition-colors text-center"
        >
          <Calendar className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <h3 className="font-semibold text-neutral-900">{t.createEvent}</h3>
        </Link>

        <Link
          href="/admin/reports"
          className="p-6 rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary hover:bg-primary-50 transition-colors text-center"
        >
          <TrendingUp className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <h3 className="font-semibold text-neutral-900">{t.viewReports}</h3>
        </Link>

        <Link
          href="/admin/users"
          className="p-6 rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary hover:bg-primary-50 transition-colors text-center"
        >
          <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <h3 className="font-semibold text-neutral-900">{t.manageUsers}</h3>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label={t.totalPatients}
          value={totalPatients.toString()}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          label={t.totalEvents}
          value={totalEvents.toString()}
          icon={<Calendar className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          label={t.rsvpRate}
          value={`${rsvpRate}%`}
          subtitle={t.rsvpRateSub}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          label={t.attendanceRate}
          value={`${attendanceRate}%`}
          subtitle={t.attendanceRateSub}
          icon={<TrendingUp className="w-6 h-6" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-neutral-900">
              {t.upcomingEvents}
            </h2>
            <Link
              href="/admin/events"
              className="text-sm text-primary hover:text-primary-600 font-semibold"
            >
              {t.viewAll}
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-neutral-500 text-sm">{t.noUpcoming}</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}/edit`}
                  className="block p-4 rounded-lg border border-neutral-200 hover:border-primary hover:bg-primary-50 transition-colors"
                >
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    {locale === "es" ? event.titleEs : event.titleEn}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-neutral-600">
                    <span>
                      {new Date(event.eventDate).toLocaleDateString(
                        locale === "es" ? "es-MX" : "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </span>
                    <span>•</span>
                    <span>
                      {event._count.rsvps} {t.rsvps}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <h2 className="text-xl font-display font-bold text-neutral-900 mb-4">
            {t.recentActivity}
          </h2>

          {recentActivity.length === 0 ? (
            <p className="text-neutral-500 text-sm">{t.noActivity}</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900">
                      {rsvp.patient.contactProfile?.firstName}{" "}
                      {rsvp.patient.contactProfile?.lastName}
                    </p>
                    <p className="text-xs text-neutral-600 truncate">
                      {t.rsvpdTo}{" "}
                      {locale === "es"
                        ? rsvp.event.titleEs
                        : rsvp.event.titleEn}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(rsvp.rsvpDate).toLocaleDateString(
                        locale === "es" ? "es-MX" : "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
