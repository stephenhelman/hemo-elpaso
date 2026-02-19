"use client";

import { useState } from "react";
import { FileDown, ChevronDown, ChevronUp } from "lucide-react";

interface Event {
  id: string;
  titleEn: string;
  eventDate: Date;
  category: string;
  _count: {
    rsvps: number;
    checkIns: number;
  };
  checkIns: Array<{
    attendeeRole: string;
  }>;
  rsvps: Array<any>;
}

interface Props {
  events: Event[];
}

export default function AttendanceReport({ events }: Props) {
  const [expanded, setExpanded] = useState(true);

  const handleExportCSV = () => {
    // Build CSV content
    const headers = [
      "Event",
      "Date",
      "Category",
      "RSVPs",
      "Patient Attendance",
      "Attendance Rate",
      "No-Shows",
    ];
    const rows = events.map((event) => {
      const rsvpCount = event._count.rsvps;
      const patientCheckIns = event.checkIns.length; // Already filtered to patients only
      const attendanceRate =
        rsvpCount > 0 ? Math.round((patientCheckIns / rsvpCount) * 100) : 0;
      const noShows = rsvpCount - patientCheckIns;

      return [
        event.titleEn,
        new Date(event.eventDate).toLocaleDateString(),
        event.category,
        rsvpCount,
        patientCheckIns,
        `${attendanceRate}%`,
        noShows,
      ];
    });

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split("T")[0]}.csv`;
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
              Event Attendance Report
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

      {/* Table */}
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  RSVPs
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Patient Attendance
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  No-Shows
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {events.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-neutral-500"
                  >
                    No events found in selected date range
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const rsvpCount = event._count.rsvps;
                  const patientCheckIns = event.checkIns.length;
                  const attendanceRate =
                    rsvpCount > 0
                      ? Math.round((patientCheckIns / rsvpCount) * 100)
                      : 0;
                  const noShows = rsvpCount - patientCheckIns;

                  return (
                    <tr key={event.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-neutral-900">
                          {event.titleEn}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {new Date(event.eventDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                          {event.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">
                        {rsvpCount}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">
                        {patientCheckIns}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            attendanceRate >= 80
                              ? "bg-green-100 text-green-800"
                              : attendanceRate >= 60
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {attendanceRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-neutral-600">
                        {noShows}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
