"use client";

import { useState, useMemo } from "react";
import { Download, Search, Filter } from "lucide-react";

interface CheckIn {
  id: string;
  checkInTime: Date;
  event: {
    id: string;
    titleEn: string;
    eventDate: Date;
  };
  patient: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      phone: string | null;
    } | null;
  };
}

interface Event {
  id: string;
  titleEn: string;
  eventDate: Date;
}

interface Props {
  checkIns: CheckIn[];
  events: Event[];
}

export default function AllAttendeesTable({ checkIns, events }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  // Filter check-ins
  const filteredCheckIns = useMemo(() => {
    return checkIns.filter((checkIn) => {
      // Search filter (name or email)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        checkIn.patient.profile?.firstName
          .toLowerCase()
          .includes(searchLower) ||
        checkIn.patient.profile?.lastName.toLowerCase().includes(searchLower) ||
        checkIn.patient.email.toLowerCase().includes(searchLower);

      // Event filter
      const matchesEvent =
        selectedEventId === "all" || checkIn.event.id === selectedEventId;

      // Date range filter
      const checkInDate = new Date(checkIn.checkInTime);
      const matchesDateRange =
        (!dateRange.start || checkInDate >= new Date(dateRange.start)) &&
        (!dateRange.end || checkInDate <= new Date(dateRange.end));

      return matchesSearch && matchesEvent && matchesDateRange;
    });
  }, [checkIns, searchQuery, selectedEventId, dateRange]);

  // Export to CSV
  const handleExport = () => {
    const headers = [
      "Date",
      "Event",
      "Attendee Name",
      "Email",
      "Phone",
      "Check-In Time",
    ];
    const rows = filteredCheckIns.map((checkIn) => [
      new Date(checkIn.event.eventDate).toLocaleDateString(),
      checkIn.event.titleEn,
      `${checkIn.patient.profile?.firstName} ${checkIn.patient.profile?.lastName}`,
      checkIn.patient.email,
      checkIn.patient.profile?.phone || "N/A",
      new Date(checkIn.checkInTime).toLocaleString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      {/* Filters */}
      <div className="p-6 border-b border-neutral-200 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Event Filter */}
          <div className="lg:w-64">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.titleEn} (
                  {new Date(event.eventDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={filteredCheckIns.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Date Range */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-neutral-600">
          Showing{" "}
          <span className="font-semibold">{filteredCheckIns.length}</span> of{" "}
          <span className="font-semibold">{checkIns.length}</span> check-ins
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Event
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Attendee
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Check-In Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredCheckIns.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-neutral-400"
                >
                  No check-ins found matching your filters
                </td>
              </tr>
            ) : (
              filteredCheckIns.map((checkIn) => (
                <tr
                  key={checkIn.id}
                  className="hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {new Date(checkIn.event.eventDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900">
                    <div className="max-w-xs truncate">
                      {checkIn.event.titleEn}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                    {checkIn.patient.profile?.firstName}{" "}
                    {checkIn.patient.profile?.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    <div className="max-w-xs">
                      <div className="truncate">{checkIn.patient.email}</div>
                      {checkIn.patient.profile?.phone && (
                        <div className="text-xs text-neutral-500">
                          {checkIn.patient.profile.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                    {new Date(checkIn.checkInTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
