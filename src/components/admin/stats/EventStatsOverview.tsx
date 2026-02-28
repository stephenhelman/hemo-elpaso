import {
  Users,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { adminStatsOverviewTranslation } from "@/translation/adminPages";
import type { Lang } from "@/types";

interface Props {
  totalRsvps: number;
  patientAttendance: number;
  attendanceRate: number;
  totalQuestions: number;
  answeredQuestions: number;
  totalPollResponses: number;
  locale: Lang;
}

export default function EventStatsOverview({
  totalRsvps,
  patientAttendance,
  attendanceRate,
  totalQuestions,
  answeredQuestions,
  totalPollResponses,
  locale,
}: Props) {
  const t = adminStatsOverviewTranslation[locale];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatCard
        title={t.totalRsvps}
        value={totalRsvps.toString()}
        icon={<Users className="w-6 h-6" />}
        color="blue"
      />

      <StatCard
        title={t.patientAttendance}
        value={patientAttendance.toString()}
        subtitle={t.patientsOnly}
        icon={<CheckCircle className="w-6 h-6" />}
        color="green"
      />

      <StatCard
        title={t.attendanceRate}
        value={`${attendanceRate}%`}
        icon={<TrendingUp className="w-6 h-6" />}
        color="amber"
      />

      <StatCard
        title={t.qaEngagement}
        value={`${totalQuestions}`}
        subtitle={t.answered(answeredQuestions)}
        icon={<MessageSquare className="w-6 h-6" />}
        color="purple"
      />

      <StatCard
        title={t.pollResponses}
        value={totalPollResponses.toString()}
        icon={<BarChart3 className="w-6 h-6" />}
        color="indigo"
      />

      <StatCard
        title={t.answerRate}
        value={
          totalQuestions > 0
            ? `${Math.round((answeredQuestions / totalQuestions) * 100)}%`
            : "0%"
        }
        subtitle={t.qaAnswers}
        icon={<CheckCircle2 className="w-6 h-6" />}
        color="teal"
      />
    </div>
  );
}
