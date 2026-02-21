import { prisma } from "@/lib/db";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import AllAttendeesTable from "@/components/admin/AllAttendeesTable";
import { Calendar, Users, TrendingUp, CheckCircle } from "lucide-react";

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
          All Attendees
        </h1>
        <p className="text-neutral-500">
          View and export attendance records across all events
        </p>
      </div>

      {/* Table */}
      <AllAttendeesTable checkIns={checkIns} events={events}>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Total Check-Ins"
            value={totalCheckIns.toString()}
            color="primary"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Unique Families"
            value={uniqueAttendees.toString()}
            color="blue"
          />
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            label="Events with Attendance"
            value={eventsWithAttendance.toString()}
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Avg per Event"
            value={avgAttendance.toString()}
            color="purple"
          />
        </div>
      </AllAttendeesTable>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "primary" | "blue" | "green" | "purple";
}) {
  const colorMap = {
    primary: "bg-primary-50 text-primary",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div
        className={`w-12 h-12 rounded-xl ${colorMap[color]} flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <p className="text-2xl font-display font-bold text-neutral-900 mb-1">
        {value}
      </p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}
