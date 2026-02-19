import {
  Users,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

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

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "amber" | "purple" | "indigo" | "teal";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-600",
    purple: "bg-purple-100 text-purple-600",
    indigo: "bg-indigo-100 text-indigo-600",
    teal: "bg-teal-100 text-teal-600",
  }[color];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div
        className={`w-12 h-12 rounded-xl ${colorClasses} flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-sm font-medium text-neutral-600 mb-1">{title}</h3>
      <p className="text-3xl font-display font-bold text-neutral-900">
        {value}
      </p>
      {subtitle && <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>}
    </div>
  );
}
