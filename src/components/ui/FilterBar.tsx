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
        <div className="flex flex-col items-center justify-between gap-3 mt-4 pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between w-full gap-2">
            {actions}
          </div>
          {exportButton && (
            <div className="flex flex-col w-full lg:flex-row">
              {exportButton}
            </div>
          )}
        </div>
      )}

      {stats && <p className="text-sm text-neutral-500 mt-3">{stats}</p>}
    </div>
  );
}
