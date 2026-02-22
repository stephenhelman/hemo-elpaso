"use client";

import React from "react";
import type { Lang } from "@/types";
import { LayoutGrid, List } from "lucide-react";
import { eventsActionTranslation } from "@/translation/eventsPage";

interface Props {
  lang: Lang;
  setViewMode: React.Dispatch<React.SetStateAction<"grid" | "table">>;
  viewMode: string;
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
    </div>
  );
}
