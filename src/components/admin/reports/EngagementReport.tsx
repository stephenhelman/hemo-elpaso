"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Users, TrendingUp } from "lucide-react";
import ExportButton from "@/components/ui/ExportButton";
import { adminReportsTranslation } from "@/translation/adminPages";
import type { Lang } from "@/types";

interface Event {
  id: string;
  titleEn: string;
  eventDate: Date;
  checkIns: Array<{
    patientId: string;
    patient: {
      profile: {
        firstName: string;
        lastName: string;
      } | null;
    };
  }>;
}

interface Props {
  events: Event[];
  uniquePatients: number;
  locale: Lang;
}

export default function EngagementReport({ events, uniquePatients, locale }: Props) {
  const t = adminReportsTranslation[locale];
  const [expanded, setExpanded] = useState(true);

  // Calculate patient engagement (how many events each patient attended)
  const patientEngagement: Record<
    string,
    {
      patientId: string;
      name: string;
      eventsAttended: number;
    }
  > = {};

  events.forEach((event) => {
    event.checkIns.forEach((checkIn) => {
      if (!patientEngagement[checkIn.patientId]) {
        patientEngagement[checkIn.patientId] = {
          patientId: checkIn.patientId,
          name: checkIn.patient.profile
            ? `${checkIn.patient.profile.firstName} ${checkIn.patient.profile.lastName}`
            : "Unknown",
          eventsAttended: 0,
        };
      }
      patientEngagement[checkIn.patientId].eventsAttended++;
    });
  });

  // Sort by most engaged
  const topEngaged = Object.values(patientEngagement)
    .sort((a, b) => b.eventsAttended - a.eventsAttended)
    .slice(0, 10);

  const avgEventsPerPatient =
    uniquePatients > 0
      ? (
          events.reduce((sum, e) => sum + e.checkIns.length, 0) / uniquePatients
        ).toFixed(1)
      : "0";

  const exportRows = Object.values(patientEngagement)
    .sort((a, b) => b.eventsAttended - a.eventsAttended)
    .map((p) => [p.name, p.eventsAttended]);
  return (
    <div className="bg-white rounded-2xl border border-neutral-200">
      {/* Header */}
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
              {t.engagementTitle}
            </h2>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="overflow-x-auto">
          <div className="flex flex-col lg:flex-row gap-4 p-4">
            <ExportButton
              headers={t.engagementExportHeaders}
              rows={exportRows}
              filename={`engagement-report-${new Date().toISOString().split("T")[0]}.csv`}
            />
          </div>
          <div className="px-4 pb-4 pt-2">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">
                    {t.uniquePatients}
                  </p>
                </div>
                <p className="text-3xl font-bold text-blue-900">
                  {uniquePatients}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {t.attendedAtLeastOne}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-green-900">
                    {t.avgEventsPerPatient}
                  </p>
                </div>
                <p className="text-3xl font-bold text-green-900">
                  {avgEventsPerPatient}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {t.inSelectedRange}
                </p>
              </div>
            </div>

            {/* Top 10 Most Engaged */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                {t.top10Title}
              </h3>

              {topEngaged.length === 0 ? (
                <p className="text-neutral-500 text-sm">
                  {t.noEngagement}
                </p>
              ) : (
                <div className="space-y-2">
                  {topEngaged.map((patient, index) => (
                    <div
                      key={patient.patientId}
                      className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-600">
                            {index + 1}
                          </span>
                        </div>
                        <p className="font-medium text-neutral-900">
                          {patient.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral-900">
                          {t.eventsCount(patient.eventsAttended)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
