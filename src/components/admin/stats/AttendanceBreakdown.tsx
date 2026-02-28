"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { adminAttendanceBreakdownTranslation } from "@/translation/adminPages";
import type { Lang } from "@/types";

interface Props {
  patientCount: number;
  sponsorCount: number;
  donorCount: number;
  volunteerCount: number;
  locale: Lang;
}

export default function AttendanceBreakdown({
  patientCount,
  sponsorCount,
  donorCount,
  volunteerCount,
  locale,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const t = adminAttendanceBreakdownTranslation[locale];

  const total = patientCount + sponsorCount + donorCount + volunteerCount;
  const roles = [
    { label: t.roleLabels.Patients, count: patientCount, color: "bg-blue-500" },
    { label: t.roleLabels.Sponsors, count: sponsorCount, color: "bg-purple-500" },
    { label: t.roleLabels.Donors, count: donorCount, color: "bg-green-500" },
    { label: t.roleLabels.Volunteers, count: volunteerCount, color: "bg-amber-500" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 mb-8">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5 text-neutral-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-neutral-600" />
              )}
            </button>
            <h2 className="text-xl font-display font-bold text-neutral-900">
              {t.title}
            </h2>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          <div className="space-y-4">
            {roles.map((role) => {
              const percentage =
                total > 0 ? ((role.count / total) * 100).toFixed(1) : "0";

              return (
                <div key={role.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-neutral-600" />
                      <span className="font-medium text-neutral-900">
                        {role.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-700">
                      {role.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${role.color} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
            <p className="text-sm font-medium text-neutral-900">
              {t.totalAttendance} {total}
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              {t.breakdownNote}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
