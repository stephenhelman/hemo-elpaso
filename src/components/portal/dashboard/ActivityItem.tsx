"use client";

import { Bell, Calendar, User } from "lucide-react";

export function ActivityItem({ log }: { log: any }) {
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
