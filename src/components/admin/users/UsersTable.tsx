"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Eye, UserCog } from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  profile: {
    firstName: string;
    lastName: string;
    primaryCondition: string;
    severity: string;
    city: string;
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
}

export default function UsersTable({
  users,
  conditions,
  currentSearch = "",
  currentRole = "all",
  currentCondition = "all",
}: Props) {
  const router = useRouter();
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
      `${user.profile?.firstName} ${user.profile?.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();

    return name.includes(searchLower) || email.includes(searchLower);
  });

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
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                className="w-full h-11 pl-10 pr-4 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-11 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Roles</option>
              <option value="patient">Patient</option>
              <option value="admin">Admin</option>
              <option value="board">Board</option>
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full h-11 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Conditions</option>
              {conditions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
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
          Showing <span className="font-semibold">{filteredUsers.length}</span>{" "}
          of <span className="font-semibold">{users.length}</span> users
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Condition
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                RSVPs
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Check-Ins
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Actions
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
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-neutral-900">
                        {user.profile?.firstName} {user.profile?.lastName}
                      </p>
                      <p className="text-sm text-neutral-600">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : user.role === "board"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900">
                    {user.profile?.primaryCondition || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {user.profile?.city || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">
                    {user._count.rsvps}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">
                    {user._count.checkIns}
                  </td>
                  <td className="px-6 py-4">
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
  );
}
