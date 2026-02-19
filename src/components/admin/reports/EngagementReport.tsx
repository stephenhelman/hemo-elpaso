"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Users,
  TrendingUp,
  FileDown,
} from "lucide-react";

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
}

export default function EngagementReport({ events, uniquePatients }: Props) {
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

  const handleExportCSV = () => {
    const allEngaged = Object.values(patientEngagement).sort(
      (a, b) => b.eventsAttended - a.eventsAttended,
    );

    const csv = [
      "Patient Engagement Report",
      "",
      `Total Unique Patients,${uniquePatients}`,
      `Average Events per Patient,${avgEventsPerPatient}`,
      "",
      "Patient Name,Events Attended",
      ...allEngaged.map((p) => `${p.name},${p.eventsAttended}`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `engagement-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
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
              Patient Engagement Report
            </h2>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">
                  Unique Patients
                </p>
              </div>
              <p className="text-3xl font-bold text-blue-900">
                {uniquePatients}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Attended at least one event
              </p>
            </div>

            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">
                  Avg Events per Patient
                </p>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {avgEventsPerPatient}
              </p>
              <p className="text-xs text-green-700 mt-1">
                In selected date range
              </p>
            </div>
          </div>

          {/* Top 10 Most Engaged */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Top 10 Most Engaged Patients
            </h3>

            {topEngaged.length === 0 ? (
              <p className="text-neutral-500 text-sm">
                No engagement data available
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
                        {patient.eventsAttended} events
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
