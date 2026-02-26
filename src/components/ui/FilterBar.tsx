import React from "react";

interface FilterBarProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
  exportButton?: React.ReactNode;
  stats?: React.ReactNode;
  className?: string;
}

export default function FilterBar({
  children,
  actions,
  exportButton,
  stats,
  className = "",
}: FilterBarProps) {
  const hasActionRow = actions || exportButton;

  return (
    <div
      className={`bg-white rounded-2xl border border-neutral-200 p-4 md:p-6 ${className}`}
    >
      {children}

      {hasActionRow && (
        <div className="grid grid-cols-6 gap-4 mt-4">
          <div className="flex items-center justify-between col-span-6 lg:col-span-4 gap-4">
            {actions}
          </div>
          {exportButton && (
            <div className="flex items-center col-span-6 lg:col-span-2 w-full">
              {exportButton}
            </div>
          )}
        </div>
      )}

      {stats && <p className="text-sm text-neutral-500 mt-3">{stats}</p>}
    </div>
  );
}
