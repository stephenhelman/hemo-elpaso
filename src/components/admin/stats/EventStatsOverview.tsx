import {
  Users,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";

interface Props {
  totalRsvps: number;
  patientAttendance: number;
  attendanceRate: number;
  totalQuestions: number;
  answeredQuestions: number;
  totalPollResponses: number;
}

export default function EventStatsOverview({
  totalRsvps,
  patientAttendance,
  attendanceRate,
  totalQuestions,
  answeredQuestions,
  totalPollResponses,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="Total RSVPs"
        value={totalRsvps.toString()}
        icon={<Users className="w-6 h-6" />}
        color="blue"
      />

      <StatCard
        title="Patient Attendance"
        value={patientAttendance.toString()}
        subtitle="Patients only"
        icon={<CheckCircle className="w-6 h-6" />}
        color="green"
      />

      <StatCard
        title="Attendance Rate"
        value={`${attendanceRate}%`}
        icon={<TrendingUp className="w-6 h-6" />}
        color="amber"
      />

      <StatCard
        title="Q&A Engagement"
        value={`${totalQuestions}`}
        subtitle={`${answeredQuestions} answered`}
        icon={<MessageSquare className="w-6 h-6" />}
        color="purple"
      />

      <StatCard
        title="Poll Responses"
        value={totalPollResponses.toString()}
        icon={<BarChart3 className="w-6 h-6" />}
        color="indigo"
      />

      <StatCard
        title="Answer Rate"
        value={
          totalQuestions > 0
            ? `${Math.round((answeredQuestions / totalQuestions) * 100)}%`
            : "0%"
        }
        subtitle="Q&A answers"
        icon={<CheckCircle2 className="w-6 h-6" />}
        color="teal"
      />
    </div>
  );
}
