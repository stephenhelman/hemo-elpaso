import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { Calendar, User, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  // Look up patient by Auth0 ID
  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: {
      profile: true,
      rsvps: {
        include: {
          event: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
      checkIns: {
        include: {
          event: true,
        },
      },
    },
  });

  // If no patient record, redirect to registration
  if (!patient || !patient.profile) {
    redirect("/portal/register");
  }

  const upcomingRsvps = patient.rsvps.filter(
    (rsvp) => new Date(rsvp.event.eventDate) > new Date(),
  );
  const eventsAttended = patient.checkIns.length;
  const profileComplete = !!(
    patient.profile.firstName &&
    patient.profile.lastName &&
    patient.profile.primaryCondition
  );

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
          Welcome back, {patient.profile.firstName}!
        </h1>
        <p className="text-neutral-500">
          Manage your events, profile, and stay connected with the HOEP
          community.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="Upcoming RSVPs"
          value={upcomingRsvps.length.toString()}
          color="primary"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          label="Events Attended"
          value={eventsAttended.toString()}
          color="secondary"
        />
        <StatCard
          icon={<User className="w-6 h-6" />}
          label="Profile Status"
          value={profileComplete ? "Complete" : "Incomplete"}
          color="accent"
        />
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">
          Your Upcoming Events
        </h2>
        {upcomingRsvps.length > 0 ? (
          <div className="space-y-3">
            {upcomingRsvps.map((rsvp) => (
              <EventRow key={rsvp.id} rsvp={rsvp} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm mb-4">
              No upcoming RSVPs yet. Browse events to get started!
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              Browse Events
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
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

function EventRow({ rsvp }: { rsvp: any }) {
  const eventDate = new Date(rsvp.event.eventDate);

  return (
    <Link
      href={`/events/${rsvp.event.slug}`}
      className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary-50 flex flex-col items-center justify-center">
          <span className="text-xs text-primary-600 font-semibold">
            {eventDate
              .toLocaleDateString("en-US", { month: "short" })
              .toUpperCase()}
          </span>
          <span className="text-lg font-bold text-primary">
            {eventDate.getDate()}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">
            {rsvp.event.titleEn}
          </h3>
          <p className="text-sm text-neutral-500">
            {rsvp.adultsCount + rsvp.childrenCount} attendees
          </p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-primary transition-colors" />
    </Link>
  );
}
