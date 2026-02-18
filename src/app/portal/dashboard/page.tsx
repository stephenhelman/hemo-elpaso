import UpcomingEventCard from "@/components/portal/UpcomingEventCard";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import {
  Calendar,
  User,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Bell,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getRecommendedEvents } from "@/lib/event-matching";
import QrCodeDisplay from "@/components/portal/QrCodeDisplay";

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
      preferences: true,
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

  // Get recommended events
  const recommendedMatches = await getRecommendedEvents(patient.id, 3);
  const recommendedEventIds = recommendedMatches.map((m) => m.eventId);

  const recommendedEvents = await prisma.event.findMany({
    where: {
      id: { in: recommendedEventIds },
    },
  });

  // Match events with their scores and reasons
  const recommendedWithScores = recommendedEvents
    .map((event) => {
      const match = recommendedMatches.find((m) => m.eventId === event.id);
      return {
        ...event,
        matchScore: match?.score || 0,
        matchReasons: match?.reasons || [],
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  const upcomingRsvps = patient.rsvps.filter(
    (rsvp) => new Date(rsvp.event.eventDate) > new Date(),
  );
  const eventsAttended = patient.checkIns.length;
  const profileComplete = !!(
    patient.profile.firstName &&
    patient.profile.lastName &&
    patient.profile.primaryCondition
  );

  // Get recent activity
  const recentActivity = await prisma.auditLog.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Welcome back, {patient.profile.firstName}!
          </h1>
          <p className="text-neutral-500">
            Manage your events, profile, and stay connected with the HOEP
            community.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            {/* Recommended For You */}
            {recommendedWithScores.length > 0 && (
              <div className="bg-gradient-to-br from-primary-50 to-secondary/10 rounded-2xl border border-primary-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-display font-bold text-neutral-900 text-xl">
                    Recommended For You
                  </h2>
                </div>
                <p className="text-neutral-600 text-sm mb-6">
                  Based on your preferences and family profile
                </p>
                <div className="space-y-3">
                  {recommendedWithScores.map((event) => (
                    <RecommendedEventCard key={event.id} event={event} />
                  ))}
                </div>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary hover:text-primary-600 transition-colors"
                >
                  View All Events
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Your Upcoming Events */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">
                Your Upcoming Events
              </h2>
              {upcomingRsvps.length > 0 ? (
                <div className="space-y-3">
                  {upcomingRsvps.map((rsvp) => (
                    <UpcomingEventCard key={rsvp.id} rsvp={rsvp} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm mb-4">
                    No upcoming RSVPs yet. Check out our recommendations above!
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

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h3 className="font-display font-bold text-neutral-900 text-lg mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href="/events"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-50 group-hover:bg-primary flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 text-sm">
                      Browse Events
                    </p>
                    <p className="text-xs text-neutral-500">
                      Find upcoming activities
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
                </Link>

                <Link
                  href="/portal/profile"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-50 group-hover:bg-primary flex items-center justify-center">
                    <User className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 text-sm">
                      Edit Profile
                    </p>
                    <p className="text-xs text-neutral-500">
                      Update your information
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
                </Link>

                <Link
                  href="/resources"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-50 group-hover:bg-primary flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 text-sm">
                      Resources
                    </p>
                    <p className="text-xs text-neutral-500">
                      Educational materials
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h3 className="font-display font-bold text-neutral-900 text-lg mb-4">
                Recent Activity
              </h3>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((log) => (
                    <ActivityItem key={log.id} log={log} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-400 text-center py-4">
                  No recent activity
                </p>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl border border-primary-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-neutral-900 text-lg">
                  Stay Updated
                </h3>
              </div>
              <p className="text-sm text-neutral-600 mb-4">
                Get notifications about upcoming events, RSVP reminders, and
                community updates.
              </p>
              <p className="text-xs text-neutral-500">
                {patient.preferences?.emailNotifications
                  ? "✓ Email notifications enabled"
                  : "○ Email notifications disabled"}
              </p>
            </div>
          </div>
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

function RecommendedEventCard({ event }: { event: any }) {
  const eventDate = new Date(event.eventDate);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="flex items-start gap-4 p-4 rounded-xl bg-white border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all group"
    >
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-xs text-white font-semibold">
          {eventDate
            .toLocaleDateString("en-US", { month: "short" })
            .toUpperCase()}
        </span>
        <span className="text-2xl font-bold text-white">
          {eventDate.getDate()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">
            {event.titleEn}
          </h3>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex-shrink-0">
            <Sparkles className="w-3 h-3" />
            {event.matchScore}%
          </div>
        </div>
        <p className="text-sm text-neutral-500 mb-2 line-clamp-1">
          {event.descriptionEn}
        </p>
        {event.matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.matchReasons.slice(0, 2).map((reason: string, i: number) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 text-xs font-medium"
              >
                ✓ {reason}
              </span>
            ))}
          </div>
        )}
      </div>
      <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
    </Link>
  );
}

function EventRow({ rsvp }: { rsvp: any }) {
  const [showQr, setShowQr] = useState(false);
  const eventDate = new Date(rsvp.event.eventDate);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <Link
        href={`/events/${rsvp.event.slug}`}
        className="flex items-center justify-between p-4 hover:bg-primary-50/50 transition-all group"
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
              {rsvp.adultsAttending + rsvp.childrenAttending} attendees
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-primary transition-colors" />
      </Link>

      {/* QR Code Toggle */}
      <div className="border-t border-neutral-200">
        <button
          onClick={() => setShowQr(!showQr)}
          className="w-full px-4 py-2 text-sm text-primary hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
        >
          <QrCode className="w-4 h-4" />
          {showQr ? "Hide QR Code" : "Show Check-in QR Code"}
        </button>

        {showQr && (
          <div className="p-4 bg-neutral-50 border-t border-neutral-200">
            <QrCodeDisplay rsvpId={rsvp.id} eventTitle={rsvp.event.titleEn} />
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ log }: { log: any }) {
  const getActivityIcon = (action: string) => {
    if (action.includes("rsvp")) return <Calendar className="w-4 h-4" />;
    if (action.includes("profile")) return <User className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
  };

  const getActivityLabel = (action: string) => {
    if (action === "patient_registration") return "Joined HOEP";
    if (action === "rsvp_created") return "RSVP Created";
    if (action === "rsvp_cancelled") return "RSVP Cancelled";
    return action.replace(/_/g, " ");
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 flex-shrink-0">
        {getActivityIcon(log.action)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900">
          {getActivityLabel(log.action)}
        </p>
        <p className="text-xs text-neutral-500">{timeAgo(log.createdAt)}</p>
      </div>
    </div>
  );
}
