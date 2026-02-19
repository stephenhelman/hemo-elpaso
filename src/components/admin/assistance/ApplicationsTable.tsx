"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Eye } from "lucide-react";
import Link from "next/link";

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
    profile: {
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
}

export default function ApplicationsTable({
  applications,
  currentStatus = "all",
  currentType = "all",
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(currentStatus);
  const [type, setType] = useState(currentType);

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
      `${app.patient.profile?.firstName} ${app.patient.profile?.lastName}`.toLowerCase();
    const email = app.patient.email.toLowerCase();
    const purpose = app.purpose.toLowerCase();

    return (
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      purpose.includes(searchLower)
    );
  });

  const statusConfig = {
    DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-800" },
    SUBMITTED: { label: "Submitted", color: "bg-blue-100 text-blue-800" },
    UNDER_REVIEW: {
      label: "Under Review",
      color: "bg-yellow-100 text-yellow-800",
    },
    APPROVED: { label: "Approved", color: "bg-green-100 text-green-800" },
    DENIED: { label: "Denied", color: "bg-red-100 text-red-800" },
    DISBURSED: { label: "Disbursed", color: "bg-purple-100 text-purple-800" },
    CLOSED: { label: "Closed", color: "bg-gray-100 text-gray-800" },
  };

  const typeLabels = {
    EVENT_FEES: "Event Fees",
    TRANSPORTATION: "Transportation",
    MEDICATION: "Medication",
    MEDICAL_EQUIPMENT: "Medical Equipment",
    EMERGENCY_SUPPORT: "Emergency Support",
    OTHER: "Other",
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      {/* Filters */}
      <div className="p-6 border-b border-neutral-200">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-end">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by name, email, or purpose..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-11 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="DENIED">Denied</option>
              <option value="DISBURSED">Disbursed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-11 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Types</option>
              <option value="EVENT_FEES">Event Fees</option>
              <option value="TRANSPORTATION">Transportation</option>
              <option value="MEDICATION">Medication</option>
              <option value="MEDICAL_EQUIPMENT">Medical Equipment</option>
              <option value="EMERGENCY_SUPPORT">Emergency Support</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleFilter}
              className="h-11 px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap"
            >
              Apply
            </button>
            <button
              onClick={handleReset}
              className="h-11 px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors whitespace-nowrap"
            >
              Reset
            </button>
          </div>
        </div>

        <p className="text-sm text-neutral-600 mt-4">
          Showing <span className="font-semibold">{filteredApps.length}</span>{" "}
          of <span className="font-semibold">{applications.length}</span>{" "}
          applications
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Purpose
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Requested
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Docs
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Actions
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
                  No applications found
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-neutral-900">
                        {app.patient.profile?.firstName}{" "}
                        {app.patient.profile?.lastName}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {app.patient.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900">
                    {typeLabels[app.assistanceType as keyof typeof typeLabels]}
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        statusConfig[app.status as keyof typeof statusConfig]
                          ?.color || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusConfig[app.status as keyof typeof statusConfig]
                        ?.label || app.status}
                    </span>
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
                      Review
                    </Link>
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
