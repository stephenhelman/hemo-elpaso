import { prisma } from "@/lib/db";
import { Calendar, Users, CheckCircle, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Get stats
  const [totalEvents, upcomingEvents, totalRsvps, totalPatients] =
    await Promise.all([
      prisma.event.count(),
      prisma.event.count({
        where: {
          status: "published",
          eventDate: { gte: new Date() },
        },
      }),
      prisma.rsvp.count(),
      prisma.patient.count(),
    ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-neutral-500">
          Manage events, view RSVPs, and track community engagement.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="Total Events"
          value={totalEvents.toString()}
          color="primary"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Upcoming Events"
          value={upcomingEvents.toString()}
          color="secondary"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          label="Total RSVPs"
          value={totalRsvps.toString()}
          color="accent"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Registered Families"
          value={totalPatients.toString()}
          color="primary"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/admin/events/new"
            className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
          >
            + Create Event
          </a>
          <a
            href="/admin/events"
            className="px-6 py-3 rounded-full border-2 border-neutral-300 text-neutral-700 font-semibold hover:border-primary hover:text-primary transition-colors"
          >
            Manage Events
          </a>
          <a
            href="/admin/attendees"
            className="px-6 py-3 rounded-full border-2 border-neutral-300 text-neutral-700 font-semibold hover:border-primary hover:text-primary transition-colors"
          >
            View Attendees
          </a>
        </div>
      </div>
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
  color: "primary" | "secondary" | "accent";
}) {
  const colorMap = {
    primary: "bg-primary-50 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent-dark",
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
