"use client";

import React from "react";
import type { Lang } from "@/types";
import { LayoutGrid, List, CalendarDays } from "lucide-react";
import { eventsActionTranslation } from "@/translation/eventsPage";

export type ViewMode = "grid" | "table" | "calendar";

interface Props {
  lang: Lang;
  setViewMode: (mode: ViewMode) => void;
  viewMode: ViewMode;
}

export function ViewToggle({ lang, setViewMode, viewMode }: Props) {
  const t = eventsActionTranslation[lang];
  return (
    <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
      <button
        onClick={() => setViewMode("grid")}
        className={`p-2 rounded transition-colors ${
          viewMode === "grid"
            ? "bg-white text-primary shadow-sm"
            : "text-neutral-600 hover:text-neutral-900"
        }`}
        title={t.grid}
      >
        <LayoutGrid className="w-5 h-5" />
      </button>
      <button
        onClick={() => setViewMode("table")}
        className={`p-2 rounded transition-colors ${
          viewMode === "table"
            ? "bg-white text-primary shadow-sm"
            : "text-neutral-600 hover:text-neutral-900"
        }`}
        title={t.list}
      >
        <List className="w-5 h-5" />
      </button>
      <button
        onClick={() => setViewMode("calendar")}
        className={`p-2 rounded transition-colors ${
          viewMode === "calendar"
            ? "bg-white text-primary shadow-sm"
            : "text-neutral-600 hover:text-neutral-900"
        }`}
        title={t.calendar}
      >
        <CalendarDays className="w-5 h-5" />
      </button>
    </div>
  );
}
