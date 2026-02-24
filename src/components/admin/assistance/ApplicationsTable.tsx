"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import ExportButton from "@/components/ui/ExportButton";
import FilterBar from "@/components/ui/FilterBar";
import { adminAssistanceTableTranslation } from "@/translation/adminAssistance";
import { useLanguage } from "@/context/LanguageContext";

interface Application {
  id: string;
  assistanceType: string;
  requestedAmount: number;
  approvedAmount: number | null;
  status: string;
  purpose: string;
  submittedAt: Date | null;
  createdAt: Date;
  patient: {
    email: string;
    contactProfile: {
      firstName: string;
      lastName: string;
    } | null;
  };
  _count: {
    documents: number;
    disbursements: number;
  };
}

interface Props {
  applications: Application[];
  currentStatus?: string;
  currentType?: string;
  children: React.ReactNode;
}

export default function ApplicationsTable({
  applications,
  currentStatus = "all",
  currentType = "all",
  children,
}: Props) {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = adminAssistanceTableTranslation[locale];

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(currentStatus);
  const [type, setType] = useState(currentType);

  const APPLICATION_STATUS_CONFIG = {
    DRAFT: { label: t.statusLabels.DRAFT, color: "bg-gray-100 text-gray-800" },
    SUBMITTED: {
      label: t.statusLabels.SUBMITTED,
      color: "bg-blue-100 text-blue-800",
    },
    UNDER_REVIEW: {
      label: t.statusLabels.UNDER_REVIEW,
      color: "bg-yellow-100 text-yellow-800",
    },
    APPROVED: {
      label: t.statusLabels.APPROVED,
      color: "bg-green-100 text-green-800",
    },
    DENIED: { label: t.statusLabels.DENIED, color: "bg-red-100 text-red-800" },
    DISBURSED: {
      label: t.statusLabels.DISBURSED,
      color: "bg-purple-100 text-purple-800",
    },
    CLOSED: {
      label: t.statusLabels.CLOSED,
      color: "bg-gray-100 text-gray-800",
    },
  };

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (type !== "all") params.set("type", type);
    router.push(`/admin/assistance?${params.toString()}`);
  };

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    setType("all");
    router.push("/admin/assistance");
  };

  // Client-side search
  const filteredApps = applications.filter((app) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const name =
      `${app.patient.contactProfile?.firstName} ${app.patient.contactProfile?.lastName}`.toLowerCase();
    const email = app.patient.email.toLowerCase();
    const purpose = app.purpose.toLowerCase();
    return (
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      purpose.includes(searchLower)
    );
  });

  const exportRows = filteredApps.map((app) => [
    `${app.patient.contactProfile?.firstName ?? ""} ${app.patient.contactProfile?.lastName ?? ""}`.trim(),
    app.patient.email,
    t.typeLabels[app.assistanceType as keyof typeof t.typeLabels] ??
      app.assistanceType,
    app.purpose,
    Number(app.requestedAmount).toFixed(2),
    app.approvedAmount ? Number(app.approvedAmount).toFixed(2) : "",
    t.statusLabels[app.status as keyof typeof t.statusLabels] ?? app.status,
    app._count.documents,
    app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "",
  ]);

  const inputClasses =
    "w-full h-11 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary";
  const buttonClasses =
    "h-11 px-6 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap";

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <FilterBar
        actions={
          <>
            <button
              onClick={handleFilter}
              className={`${buttonClasses} bg-primary text-white hover:bg-primary-600 flex-1`}
            >
              {t.apply}
            </button>
            <button
              onClick={handleReset}
              className={`${buttonClasses} border border-neutral-300 text-neutral-700 hover:bg-neutral-50 flex-1`}
            >
              {t.reset}
            </button>
          </>
        }
        exportButton={
          <ExportButton
            headers={[
              t.csvHeaders.patient,
              t.csvHeaders.email,
              t.csvHeaders.type,
              t.csvHeaders.purpose,
              t.csvHeaders.amount,
              t.csvHeaders.approved,
              t.csvHeaders.status,
              t.csvHeaders.docs,
              t.csvHeaders.submitted,
            ]}
            rows={exportRows}
            filename={`assistance-applications-${new Date().toISOString().split("T")[0]}.csv`}
          />
        }
        stats={<>{t.showing(filteredApps.length, applications.length)}</>}
      >
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t.searchLabel}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`pl-10 ${inputClasses}`}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t.statusLabel}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClasses}
            >
              <option value="all">{t.allStatuses}</option>
              <option value="SUBMITTED">{t.statusLabels.SUBMITTED}</option>
              <option value="UNDER_REVIEW">
                {t.statusLabels.UNDER_REVIEW}
              </option>
              <option value="APPROVED">{t.statusLabels.APPROVED}</option>
              <option value="DENIED">{t.statusLabels.DENIED}</option>
              <option value="DISBURSED">{t.statusLabels.DISBURSED}</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t.typeLabel}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={inputClasses}
            >
              <option value="all">{t.allTypes}</option>
              <option value="EVENT_FEES">{t.typeLabels.EVENT_FEES}</option>
              <option value="TRANSPORTATION">
                {t.typeLabels.TRANSPORTATION}
              </option>
              <option value="MEDICATION">{t.typeLabels.MEDICATION}</option>
              <option value="MEDICAL_EQUIPMENT">
                {t.typeLabels.MEDICAL_EQUIPMENT}
              </option>
              <option value="EMERGENCY_SUPPORT">
                {t.typeLabels.EMERGENCY_SUPPORT}
              </option>
              <option value="OTHER">{t.typeLabels.OTHER}</option>
            </select>
          </div>
        </div>
      </FilterBar>
      {children}
      {/* Table Card */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.patient}
                </th>
                <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.type}
                </th>
                <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.purpose}
                </th>
                <th className="px-3 py-3 md:px-6 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.requested}
                </th>
                <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.status}
                </th>
                <th className="px-3 py-3 md:px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.docs}
                </th>
                <th className="px-3 py-3 md:px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredApps.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-neutral-400"
                  >
                    {t.noFound}
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-3 py-3 md:px-6 md:py-4">
                      <div>
                        <p className="font-medium text-neutral-900">
                          {app.patient.contactProfile?.firstName}{" "}
                          {app.patient.contactProfile?.lastName}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {app.patient.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900">
                      {t.typeLabels[
                        app.assistanceType as keyof typeof t.typeLabels
                      ] ?? app.assistanceType}
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4">
                      <p className="text-sm text-neutral-900 line-clamp-2 max-w-xs">
                        {app.purpose}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-neutral-900">
                        ${Number(app.requestedAmount).toFixed(2)}
                      </p>
                      {app.approvedAmount && (
                        <p className="text-sm text-green-600">
                          ${Number(app.approvedAmount).toFixed(2)}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4">
                      <StatusBadge
                        status={app.status}
                        config={APPLICATION_STATUS_CONFIG}
                      />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-neutral-600">
                      {app._count.documents}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/admin/assistance/${app.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        {t.review}
                      </Link>
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
