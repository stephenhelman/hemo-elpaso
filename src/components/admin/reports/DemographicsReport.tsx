"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileDown } from "lucide-react";

interface Props {
  totalPatients: number;
  ageGroups: Record<string, number>;
  conditions: Record<string, number>;
  severities: Record<string, number>;
  cities: Record<string, number>;
}

export default function DemographicsReport({
  totalPatients,
  ageGroups,
  conditions,
  severities,
  cities,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  const handleExportCSV = () => {
    const csv = [
      "Demographics Report",
      "",
      "Total Patients," + totalPatients,
      "",
      "Age Groups",
      "Age Range,Count,Percentage",
      ...Object.entries(ageGroups).map(
        ([age, count]) =>
          `${age},${count},${((count / totalPatients) * 100).toFixed(1)}%`,
      ),
      "",
      "Conditions",
      "Condition,Count,Percentage",
      ...Object.entries(conditions).map(
        ([condition, count]) =>
          `${condition},${count},${((count / totalPatients) * 100).toFixed(1)}%`,
      ),
      "",
      "Severity",
      "Severity,Count,Percentage",
      ...Object.entries(severities).map(
        ([severity, count]) =>
          `${severity},${count},${((count / totalPatients) * 100).toFixed(1)}%`,
      ),
      "",
      "Cities",
      "City,Count,Percentage",
      ...Object.entries(cities)
        .sort((a, b) => b[1] - a[1])
        .map(
          ([city, count]) =>
            `${city},${count},${((count / totalPatients) * 100).toFixed(1)}%`,
        ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demographics-report-${new Date().toISOString().split("T")[0]}.csv`;
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
              Demographics Report
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Age Groups */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Age Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(ageGroups).map(([age, count]) => {
                  const percentage = ((count / totalPatients) * 100).toFixed(1);
                  return (
                    <div key={age} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-neutral-700">
                          {age}
                        </span>
                        <span className="text-neutral-600">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conditions */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Primary Conditions
              </h3>
              <div className="space-y-3">
                {Object.entries(conditions).map(([condition, count]) => {
                  const percentage = ((count / totalPatients) * 100).toFixed(1);
                  return (
                    <div key={condition} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-neutral-700">
                          {condition}
                        </span>
                        <span className="text-neutral-600">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Severity */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Severity Levels
              </h3>
              <div className="space-y-3">
                {Object.entries(severities).map(([severity, count]) => {
                  const percentage = ((count / totalPatients) * 100).toFixed(1);
                  return (
                    <div key={severity} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-neutral-700">
                          {severity}
                        </span>
                        <span className="text-neutral-600">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cities */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Geographic Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(cities)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([city, count]) => {
                    const percentage = ((count / totalPatients) * 100).toFixed(
                      1,
                    );
                    return (
                      <div key={city} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-neutral-700">
                            {city}
                          </span>
                          <span className="text-neutral-600">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
