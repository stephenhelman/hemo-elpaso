"use client";

import { Newspaper } from "lucide-react";

interface Props {
  newsletterMode: boolean;
  onToggle: () => void;
  selectedCount: number;
}

export default function NewsletterModeToggle({
  newsletterMode,
  onToggle,
  selectedCount,
}: Props) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
        newsletterMode
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
      }`}
    >
      <Newspaper className="w-4 h-4" />
      {newsletterMode ? (
        <span>
          Newsletter Mode{" "}
          {selectedCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
              {selectedCount} selected
            </span>
          )}
        </span>
      ) : (
        "Select for Newsletter"
      )}
    </button>
  );
}
