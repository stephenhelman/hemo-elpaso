"use client";

import {
  Bell,
  Calendar,
  User,
  DollarSign,
  FileText,
  Users,
  CheckCircle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { activityItemTranslation } from "@/translation/portal";
import { auditActionEnum } from "@/translation/enumConfig";
import { translateEnum } from "@/translation/enumTranslation";
import type { AuditAction } from "@prisma/client";

const actionIconMap: Partial<Record<AuditAction, React.ReactNode>> = {
  RSVP_CREATED: <Calendar className="w-4 h-4" />,
  RSVP_CANCELLED: <Calendar className="w-4 h-4" />,
  PROFILE_UPDATED: <User className="w-4 h-4" />,
  REGISTRATION_COMPLETED: <User className="w-4 h-4" />,
  FAMILY_MEMBER_ADDED: <Users className="w-4 h-4" />,
  FAMILY_MEMBER_UPDATED: <Users className="w-4 h-4" />,
  FAMILY_MEMBER_DELETED: <Users className="w-4 h-4" />,
  ASSISTANCE_APPLICATION_CREATED: <DollarSign className="w-4 h-4" />,
  ASSISTANCE_APPLICATION_UPDATED: <DollarSign className="w-4 h-4" />,
  ASSISTANCE_APPLICATION_APPROVED: <DollarSign className="w-4 h-4" />,
  ASSISTANCE_APPLICATION_DENIED: <DollarSign className="w-4 h-4" />,
  ASSISTANCE_DOCUMENT_UPLOADED: <FileText className="w-4 h-4" />,
  ASSISTANCE_DOCUMENT_DELETED: <FileText className="w-4 h-4" />,
  CHECKIN_CREATED: <CheckCircle className="w-4 h-4" />,
  DIAGNOSIS_APPROVED: <FileText className="w-4 h-4" />,
  DIAGNOSIS_REJECTED: <FileText className="w-4 h-4" />,
};

export function ActivityItem({ log }: { log: { action: AuditAction; createdAt: Date } }) {
  const { locale } = useLanguage();
  const t = activityItemTranslation[locale];

  const getActivityIcon = (action: AuditAction) => {
    return actionIconMap[action] ?? <Bell className="w-4 h-4" />;
  };

  const getActivityLabel = (action: AuditAction) => {
    if (action in auditActionEnum) {
      return translateEnum(auditActionEnum, action, locale);
    }
    return (action as string).replace(/_/g, " ");
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );
    if (seconds < 60) return t.justNow;
    if (seconds < 3600) return t.minutesAgo(Math.floor(seconds / 60));
    if (seconds < 86400) return t.hoursAgo(Math.floor(seconds / 3600));
    return t.daysAgo(Math.floor(seconds / 86400));
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
