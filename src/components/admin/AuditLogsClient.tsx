"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { Lang } from "@/types";

interface AuditLogEntry {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: string | null;
  createdAt: Date | string;
  patient: {
    email: string;
    contactProfile: { firstName: string; lastName: string } | null;
  } | null;
}

interface Props {
  logs: AuditLogEntry[];
  total: number;
  totalPages: number;
  currentPage: number;
  allActions: string[];
  locale: Lang;
  currentFilters: {
    action?: string;
    patientSearch?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export default function AuditLogsClient({
  logs,
  total,
  totalPages,
  currentPage,
  allActions,
  currentFilters,
}: Props) {
  const router = useRouter();
  const [filters, setFilters] = useState({
    action: currentFilters.action ?? "",
    patientSearch: currentFilters.patientSearch ?? "",
    dateFrom: currentFilters.dateFrom ?? "",
    dateTo: currentFilters.dateTo ?? "",
  });

  const applyFilters = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (filters.action) params.set("action", filters.action);
    if (filters.patientSearch) params.set("patientSearch", filters.patientSearch);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({ action: "", patientSearch: "", dateFrom: "", dateTo: "" });
    router.push("/admin/audit-logs");
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams();
    params.set("page", String(p));
    if (currentFilters.action) params.set("action", currentFilters.action);
    if (currentFilters.patientSearch) params.set("patientSearch", currentFilters.patientSearch);
    if (currentFilters.dateFrom) params.set("dateFrom", currentFilters.dateFrom);
    if (currentFilters.dateTo) params.set("dateTo", currentFilters.dateTo);
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const inputClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors";

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-neutral-900">
              Audit Log
            </h1>
            <p className="text-sm text-neutral-500">
              {total.toLocaleString()} entries — read-only
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Action type */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters((p) => ({ ...p, action: e.target.value }))}
                className={inputClass}
              >
                <option value="">All actions</option>
                {allActions.map((a) => (
                  <option key={a} value={a}>
                    {a.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Patient search */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Patient Name / Email
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={filters.patientSearch}
                  onChange={(e) => setFilters((p) => ({ ...p, patientSearch: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                className={inputClass}
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={applyFilters}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-600 text-sm font-medium hover:bg-neutral-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-neutral-400 text-sm"
                    >
                      No audit log entries found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const name = log.patient?.contactProfile
                      ? `${log.patient.contactProfile.firstName} ${log.patient.contactProfile.lastName}`
                      : log.patient?.email ?? "—";
                    const ts = new Date(log.createdAt);
                    return (
                      <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-neutral-500 text-xs">
                          <div>{ts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                          <div className="text-neutral-400">{ts.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-xs font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-600 text-xs">
                          {log.resourceType && (
                            <div className="font-medium">{log.resourceType}</div>
                          )}
                          {log.resourceId && (
                            <div className="text-neutral-400 font-mono truncate max-w-[120px]" title={log.resourceId}>
                              {log.resourceId.slice(0, 8)}…
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 text-sm">
                          {name}
                        </td>
                        <td className="px-4 py-3 text-neutral-500 text-xs max-w-xs">
                          <span className="line-clamp-2">{log.details ?? "—"}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
              <p className="text-sm text-neutral-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p =
                    totalPages <= 5
                      ? i + 1
                      : currentPage <= 3
                        ? i + 1
                        : currentPage >= totalPages - 2
                          ? totalPages - 4 + i
                          : currentPage - 2 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        p === currentPage
                          ? "bg-primary text-white"
                          : "hover:bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
