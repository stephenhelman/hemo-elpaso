import { ReactNode } from "react";
import type { StatColor } from "@/types";
import { STAT_COLORS } from "@/lib/statColorConfig";

interface Props {
  label: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  color: StatColor;
}

export function StatCard({ label, value, subtitle, icon, color }: Props) {
  const colorClasses = STAT_COLORS[color];
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl ${colorClasses} flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-neutral-600 mb-1">{label}</h3>
      <p className="text-3xl font-display font-bold text-neutral-900">
        {value}
      </p>
      {subtitle && <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>}
    </div>
  );
}
