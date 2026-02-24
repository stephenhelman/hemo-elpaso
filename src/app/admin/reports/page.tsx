import { redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { Calendar, Users, TrendingUp } from "lucide-react";
import ReportsFilters from "@/components/admin/reports/ReportsFilters";
import AttendanceReport from "@/components/admin/reports/AttendanceReport";
import EngagementReport from "@/components/admin/reports/EngagementReport";
import DemographicsReport from "@/components/admin/reports/DemographicsReport";
import { cookies } from "next/headers";
import { Lang } from "@/types";
import { adminReportsTranslation } from "@/translation/adminPages";

interface Props {
  searchParams: {
    startDate?: string;
    endDate?: string;
    category?: string;
    export?: string;
  };
}

export default async function ReportsPage({ searchParams }: Props) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

  const locale = ((await cookies()).get("locale")?.value as Lang) || "en";
  const t = adminReportsTranslation[locale];

  // Parse filters
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const startDate = searchParams.startDate
    ? new Date(searchParams.startDate)
    : sixMonthsAgo;

  const endDate = searchParams.endDate ? new Date(searchParams.endDate) : now;

  const category = searchParams.category || "all";

  // Build event filter
  const eventFilter: any = {
    status: "published",
    eventDate: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (category !== "all") {
    eventFilter.category = category;
  }

  // Fetch events in date range
  const events = await prisma.event.findMany({
    where: eventFilter,
    include: {
      _count: {
        select: {
          rsvps: true,
          checkIns: true,
        },
      },
      checkIns: {
        where: {
          attendeeRole: "patient", // Only count patients, not sponsors/donors
        },
        include: {
          patient: {
            include: {
              contactProfile: true,
            },
          },
        },
      },
      rsvps: {
        include: {
          patient: {
            include: {
              contactProfile: true,
            },
          },
        },
      },
    },
    orderBy: {
      eventDate: "desc",
    },
  });

  // Calculate summary stats
  const totalEvents = events.length;
  const totalRsvps = events.reduce((sum, e) => sum + e._count.rsvps, 0);
  const totalCheckIns = events.reduce((sum, e) => sum + e.checkIns.length, 0); // Patient check-ins only
  const avgAttendanceRate =
    totalRsvps > 0 ? Math.round((totalCheckIns / totalRsvps) * 100) : 0;

  // Get unique patients who attended (patient role only)
  const uniquePatientIds = new Set(
    events.flatMap((e) => e.checkIns.map((c) => c.patientId)),
  );
  const uniquePatients = uniquePatientIds.size;

  // Demographics data (all patients, not filtered by events)
  const allPatients = await prisma.patient.findMany({
    where: {
      role: "patient",
    },
    include: {
      contactProfile: true,
      disorderProfile: true,
    },
  });

  // Age distribution
  const ageGroups = {
    "0-17": 0,
    "18-30": 0,
    "31-50": 0,
    "51+": 0,
  };

  allPatients.forEach((patient) => {
    if (!patient.contactProfile?.dateOfBirth) return;

    const age = Math.floor(
      (now.getTime() - new Date(patient.contactProfile.dateOfBirth).getTime()) /
        (365.25 * 24 * 60 * 60 * 1000),
    );

    if (age <= 17) ageGroups["0-17"]++;
    else if (age <= 30) ageGroups["18-30"]++;
    else if (age <= 50) ageGroups["31-50"]++;
    else ageGroups["51+"]++;
  });

  // Condition distribution
  const conditions: Record<string, number> = {};
  allPatients.forEach((patient) => {
    const condition = patient.disorderProfile?.condition;
    if (condition) {
      conditions[condition] = (conditions[condition] || 0) + 1;
    }
  });

  // Severity distribution
  const severities: Record<string, number> = {};
  allPatients.forEach((patient) => {
    const severity = patient.disorderProfile?.severity;
    if (severity) {
      severities[severity] = (severities[severity] || 0) + 1;
    }
  });

  // City distribution
  const cities: Record<string, number> = {};
  allPatients.forEach((patient) => {
    const city = patient.contactProfile?.city;
    if (city) {
      cities[city] = (cities[city] || 0) + 1;
    }
  });

  const attendanceExportRows = events.map((event) => {
    const rsvps = event._count.rsvps;
    const checkIns = event.checkIns.length;
    const rate = rsvps > 0 ? Math.round((checkIns / rsvps) * 100) : 0;
    return [
      event.titleEn,
      new Date(event.eventDate).toLocaleDateString(),
      event.category,
      rsvps,
      checkIns,
      `${rate}%`,
      rsvps - checkIns,
    ];
  });

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
          {t.heading}
        </h1>
        <p className="text-neutral-600">{t.subtitle}</p>
      </div>

      {/* Filters */}
      <ReportsFilters
        startDate={startDate}
        endDate={endDate}
        category={category}
        attendanceExportRows={attendanceExportRows}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title={t.totalEvents}
          value={totalEvents.toString()}
          icon={<Calendar className="w-6 h-6" />}
          color="blue"
        />
        <SummaryCard
          title={t.totalRsvps}
          value={totalRsvps.toString()}
          icon={<Users className="w-6 h-6" />}
          color="purple"
        />
        <SummaryCard
          title={t.patientAttendance}
          value={totalCheckIns.toString()}
          subtitle={t.patientsOnly}
          icon={<Users className="w-6 h-6" />}
          color="green"
        />
        <SummaryCard
          title={t.attendanceRate}
          value={`${avgAttendanceRate}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="amber"
        />
      </div>

      {/* Reports Sections */}
      <div className="space-y-8">
        {/* Attendance Report */}
        <AttendanceReport events={events} />

        {/* Engagement Report */}
        <EngagementReport events={events} uniquePatients={uniquePatients} />

        {/* Demographics Report */}
        <DemographicsReport
          totalPatients={allPatients.length}
          ageGroups={ageGroups}
          conditions={conditions}
          severities={severities}
          cities={cities}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: "blue" | "purple" | "green" | "amber";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-600",
  }[color];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div
        className={`w-12 h-12 rounded-xl ${colorClasses} flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-sm font-medium text-neutral-600 mb-1">{title}</h3>
      <p className="text-3xl font-display font-bold text-neutral-900">
        {value}
      </p>
      {subtitle && <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>}
    </div>
  );
}
