"use client";

import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import ExportButton from "@/components/ui/ExportButton";
import FilterBar from "@/components/ui/FilterBar";
import { adminAttendanceTableTranslation } from "@/translation/adminPages";
import type { Lang } from "@/types";

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
  children: React.ReactNode;
  locale: Lang;
}

export default function AllAttendeesTable({
  checkIns,
  events,
  children,
  locale,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const t = adminAttendanceTableTranslation[locale];

  // Filter check-ins
  const filteredCheckIns = useMemo(() => {
    return checkIns.filter((checkIn) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        checkIn.patient.profile?.firstName
          .toLowerCase()
          .includes(searchLower) ||
        checkIn.patient.profile?.lastName.toLowerCase().includes(searchLower) ||
        checkIn.patient.email.toLowerCase().includes(searchLower);

      const matchesEvent =
        selectedEventId === "all" || checkIn.event.id === selectedEventId;

      const checkInDate = new Date(checkIn.checkInTime);
      const matchesDateRange =
        (!dateRange.start || checkInDate >= new Date(dateRange.start)) &&
        (!dateRange.end || checkInDate <= new Date(dateRange.end));

      return matchesSearch && matchesEvent && matchesDateRange;
    });
  }, [checkIns, searchQuery, selectedEventId, dateRange]);

  const exportRows = filteredCheckIns.map((checkIn) => [
    new Date(checkIn.event.eventDate).toLocaleDateString(),
    checkIn.event.titleEn,
    `${checkIn.patient.profile?.firstName ?? ""} ${checkIn.patient.profile?.lastName ?? ""}`.trim(),
    checkIn.patient.email,
    checkIn.patient.profile?.phone ?? "N/A",
    new Date(checkIn.checkInTime).toLocaleString(),
  ]);

  const inputClasses =
    "w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <FilterBar
        exportButton={
          <ExportButton
            headers={t.exportHeaders}
            rows={exportRows}
            filename={`attendance-report-${new Date().toISOString().split("T")[0]}.csv`}
          />
        }
        stats={
          <>{t.showing(filteredCheckIns.length, checkIns.length)}</>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 ${inputClasses}`}
            />
          </div>

          {/* Event Filter */}
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className={inputClasses}
          >
            <option value="all">{t.allEvents}</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.titleEn} (
                {new Date(event.eventDate).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t.fromDate}
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className={inputClasses}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t.toDate}
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className={inputClasses}
            />
          </div>
        </div>
      </FilterBar>

      {children}

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.date}
                </th>
                <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.event}
                </th>
                <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.attendee}
                </th>
                <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.contact}
                </th>
                <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.checkInTime}
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
                    {t.noCheckIns}
                  </td>
                </tr>
              ) : (
                filteredCheckIns.map((checkIn) => (
                  <tr
                    key={checkIn.id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm text-neutral-900">
                      {new Date(checkIn.event.eventDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 text-sm text-neutral-900">
                      <div className="max-w-xs truncate">
                        {checkIn.event.titleEn}
                      </div>
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {checkIn.patient.profile?.firstName}{" "}
                      {checkIn.patient.profile?.lastName}
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 text-sm text-neutral-600">
                      <div className="max-w-xs">
                        <div className="truncate">{checkIn.patient.email}</div>
                        {checkIn.patient.profile?.phone && (
                          <div className="text-xs text-neutral-500">
                            {checkIn.patient.profile.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm text-neutral-600">
                      {new Date(checkIn.checkInTime).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
