"use client";

import { Search } from "lucide-react";
import React from "react";
import { eventsActionTranslation } from "@/translation/eventsPage";
import type { Lang } from "@/types";

interface Props {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  lang: Lang;
}

export function EventsSearchBar({ searchQuery, setSearchQuery, lang }: Props) {
  const t = eventsActionTranslation[lang];
  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
      <input
        type="text"
        placeholder={t.search}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
