import {
  Users,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { adminStatsOverviewTranslation } from "@/translation/adminPages";
import type { Lang } from "@/types";

interface Props {
  totalRsvps: number;
  patientAttendance: number;
  attendanceRate: number;
  locale: Lang;
}

export default function EventStatsOverview({
  totalRsvps,
  patientAttendance,
  attendanceRate,
  locale,
}: Props) {
  const t = adminStatsOverviewTranslation[locale];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatCard
        label={t.totalRsvps}
        value={totalRsvps.toString()}
        icon={<Users className="w-6 h-6" />}
        color="blue"
      />

      <StatCard
        label={t.patientAttendance}
        value={patientAttendance.toString()}
        subtitle={t.patientsOnly}
        icon={<CheckCircle className="w-6 h-6" />}
        color="green"
      />

      <StatCard
        label={t.attendanceRate}
        value={`${attendanceRate}%`}
        icon={<TrendingUp className="w-6 h-6" />}
        color="amber"
      />
    </div>
  );
}
