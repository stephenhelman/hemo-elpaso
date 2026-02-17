import { getSession } from "@auth0/nextjs-auth0";
import { Calendar, User, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const session = await getSession();

  // TODO: Look up patient record by Auth0 user ID
  // For now, show onboarding state

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
          Welcome back, {session?.user.name?.split(" ")[0]}!
        </h1>
        <p className="text-neutral-500">
          Manage your events, profile, and stay connected with the HOEP
          community.
        </p>
      </div>

      {/* Onboarding banner */}
      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-neutral-900 text-lg mb-2">
              Complete Your Profile
            </h2>
            <p className="text-neutral-600 text-sm mb-4">
              To RSVP for events and receive personalized recommendations,
              please complete your patient profile.
            </p>
            <Link
              href="/portal/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
            >
              Complete Profile
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="Upcoming RSVPs"
          value="0"
          color="primary"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          label="Events Attended"
          value="0"
          color="secondary"
        />
        <StatCard
          icon={<User className="w-6 h-6" />}
          label="Profile Status"
          value="Incomplete"
          color="accent"
        />
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">
          Upcoming Events
        </h2>
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
