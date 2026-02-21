"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Filter } from "lucide-react";
import FilterBar from "@/components/ui/FilterBar";
import ExportButton from "@/components/ui/ExportButton";

interface Props {
  startDate: Date;
  endDate: Date;
  category: string;
  attendanceExportRows: (string | number)[][];
}

export default function ReportsFilters({
  startDate,
  endDate,
  category,
  attendanceExportRows,
}: Props) {
  const router = useRouter();

  const [filters, setFilters] = useState({
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    category,
  });

  const handleApply = () => {
    const params = new URLSearchParams();
    params.set("startDate", filters.startDate);
    params.set("endDate", filters.endDate);
    if (filters.category !== "all") {
      params.set("category", filters.category);
    }
    router.push(`/admin/reports?${params.toString()}`);
  };

  const handleReset = () => {
    router.push("/admin/reports");
  };

  const inputClasses =
    "w-full h-11 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary";
  const buttonClasses =
    "h-11 px-6 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap";

  return (
    <FilterBar
      className="mb-8"
      actions={
        <>
          <button
            onClick={handleApply}
            className={`${buttonClasses} bg-primary text-white hover:bg-primary-600 flex-1`}
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className={`${buttonClasses} border border-neutral-300 text-neutral-700 hover:bg-neutral-50 flex-1`}
          >
            Reset
          </button>
        </>
      }
      exportButton={
        <ExportButton
          headers={[
            "Event",
            "Date",
            "Category",
            "RSVPs",
            "Patient Attendance",
            "Attendance Rate",
            "No-Shows",
          ]}
          rows={attendanceExportRows}
          filename={`events-report-${new Date().toISOString().split("T")[0]}.csv`}
        />
      }
    >
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-neutral-600" />
        <h2 className="text-lg font-display font-bold text-neutral-900">
          Filters
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            className={inputClasses}
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
            className={inputClasses}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className={inputClasses}
          >
            <option value="all">All Categories</option>
            <option value="educational">Educational</option>
            <option value="social">Social</option>
            <option value="fundraiser">Fundraiser</option>
            <option value="support">Support</option>
          </select>
        </div>
      </div>
    </FilterBar>
  );
}
