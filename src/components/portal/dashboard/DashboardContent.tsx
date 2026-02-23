"use client";

import { StatCard } from "@/components/ui/StatCard";
import {
  Calendar,
  CheckCircle,
  User,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { PortalPatient } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { RecommendedEventCard } from "./RecommendedEventCard";
import UpcomingEventCard from "../UpcomingEventCard";
import { ActivityItem } from "./ActivityItem";
import { portalDashboardTranslation } from "@/translation/portal";

interface Props {
  patient: PortalPatient;
  recommendedEvents: any[];
  recommendedMatches: any[];
  recentActivity: any[];
  liveEventBanner?: React.ReactNode;
}

export function PortalDashboardContent({
  patient,
  recommendedEvents,
  recommendedMatches,
  recentActivity,
  liveEventBanner,
}: Props) {
  const { locale } = useLanguage();
  const t = portalDashboardTranslation[locale];
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

  const upcomingRsvps =
    patient?.rsvps?.filter(
      (rsvp) => new Date(rsvp.event.eventDate) > new Date(),
    ) || [];
  const eventsAttended = patient?.checkIns?.length || 0;
  const profileComplete = !!(
    patient?.profile?.firstName &&
    patient?.profile?.lastName &&
    patient?.profile?.primaryCondition
  );
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {liveEventBanner}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            {t.welcome} {patient.profile.firstName}!
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
                    <RecommendedEventCard
                      key={event.id}
                      event={event}
                      locale={locale}
                    />
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
