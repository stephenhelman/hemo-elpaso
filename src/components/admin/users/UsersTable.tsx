"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, UserCog } from "lucide-react";
import Link from "next/link";
import ExportButton from "@/components/ui/ExportButton";
import FilterBar from "@/components/ui/FilterBar";
import { adminUsersTranslation } from "@/translation/adminPages";
import type { Lang } from "@/types";

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  contactProfile: {
    firstName: string;
    lastName: string;
    city: string;
  } | null;
  disorderProfile: {
    condition: string;
    severity: string;
  } | null;
  _count: {
    rsvps: number;
    checkIns: number;
  };
}

interface Props {
  users: User[];
  conditions: string[];
  currentSearch?: string;
  currentRole?: string;
  currentCondition?: string;
  children: React.ReactNode;
  locale: Lang;
}

export default function UsersTable({
  users,
  conditions,
  currentSearch = "",
  currentRole = "all",
  currentCondition = "all",
  children,
  locale,
}: Props) {
  const router = useRouter();
  const t = adminUsersTranslation[locale];

  const [search, setSearch] = useState(currentSearch);
  const [role, setRole] = useState(currentRole);
  const [condition, setCondition] = useState(currentCondition);

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (role !== "all") params.set("role", role);
    if (condition !== "all") params.set("condition", condition);
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleReset = () => {
    setSearch("");
    setRole("all");
    setCondition("all");
    router.push("/admin/users");
  };

  // Client-side search filter
  const filteredUsers = users.filter((user) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const name =
      `${user.contactProfile?.firstName} ${user.contactProfile?.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });

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
            apiEndpoint="/api/admin/users/export"
            apiParams={{ search, role, condition }}
            filename={`users-${new Date().toISOString().split("T")[0]}.csv`}
            className="flex-1"
          />
        }
        stats={<>{t.showing(filteredUsers.length, users.length)}</>}
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
                onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                className={`pl-10 ${inputClasses}`}
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t.roleLabel}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClasses}
            >
              <option value="all">{t.allRoles}</option>
              <option value="patient">{t.roleLabels.patient}</option>
              <option value="admin">{t.roleLabels.admin}</option>
              <option value="board">{t.roleLabels.board}</option>
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t.conditionLabel}
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className={inputClasses}
            >
              <option value="all">{t.allConditions}</option>
              {conditions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
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
                  {t.tableHeaders.user}
                </th>
                <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.role}
                </th>
                <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.condition}
                </th>
                <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.location}
                </th>
                <th className="px-3 py-3 md:px-6 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.rsvps}
                </th>
                <th className="px-3 py-3 md:px-6 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.checkIns}
                </th>
                <th className="px-3 py-3 md:px-6 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  {t.tableHeaders.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-neutral-400"
                  >
                    {t.noFound}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-3 py-3 md:px-6 md:py-4">
                      <div>
                        <p className="font-medium text-neutral-900">
                          {user.contactProfile?.firstName}{" "}
                          {user.contactProfile?.lastName}
                        </p>
                        <p className="text-sm text-neutral-600">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "board"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {t.roleLabels[user.role as keyof typeof t.roleLabels] ??
                          user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900">
                      {user.disorderProfile?.condition || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {user.contactProfile?.city || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">
                      {user._count.rsvps}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">
                      {user._count.checkIns}
                    </td>
                    <td className="px-3 py-3 md:px-6 md:py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/users/${user.id}/edit`}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <UserCog className="w-4 h-4" />
                        </Link>
                      </div>
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
