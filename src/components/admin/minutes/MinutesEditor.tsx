"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Type,
  Heading,
} from "lucide-react";

export interface MinutesSection {
  type: "header" | "paragraph";
  contentEn: string;
  contentEs: string;
  redacted: boolean;
}

interface Props {
  sections: MinutesSection[];
  onChange: (sections: MinutesSection[]) => void;
}

export default function MinutesEditor({ sections, onChange }: Props) {
  const addSection = (type: "header" | "paragraph") => {
    onChange([
      ...sections,
      { type, contentEn: "", contentEs: "", redacted: false },
    ]);
  };

  const updateSection = (index: number, updates: Partial<MinutesSection>) => {
    const updated = sections.map((s, i) =>
      i === index ? { ...s, ...updates } : s,
    );
    onChange(updated);
  };

  const removeSection = (index: number) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const next = [...sections];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {sections.length === 0 && (
        <div className="p-8 rounded-xl border-2 border-dashed border-neutral-200 text-center">
          <Type className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-neutral-500 text-sm">
            No sections yet. Add a header or paragraph below.
          </p>
        </div>
      )}

      {sections.map((section, index) => (
        <div
          key={index}
          className={`rounded-xl border p-4 transition-all ${
            section.redacted
              ? "border-red-200 bg-red-50"
              : "border-neutral-200 bg-white"
          }`}
        >
          {/* Section toolbar */}
          <div className="flex items-center gap-2 mb-3">
            <GripVertical className="w-4 h-4 text-neutral-300" />

            {/* Type badge */}
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                section.type === "header"
                  ? "bg-primary-100 text-primary-800"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {section.type === "header" ? "Header" : "Paragraph"}
            </span>

            <div className="flex-1" />

            {/* Move up/down */}
            <button
              type="button"
              onClick={() => moveSection(index, "up")}
              disabled={index === 0}
              className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30 transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => moveSection(index, "down")}
              disabled={index === sections.length - 1}
              className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Redact toggle */}
            <button
              type="button"
              onClick={() =>
                updateSection(index, { redacted: !section.redacted })
              }
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
                section.redacted
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
              title={section.redacted ? "Unredact" : "Redact from public"}
            >
              {section.redacted ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  Redacted
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  Public
                </>
              )}
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => removeSection(index)}
              className="p-1 text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Content inputs */}
          {section.redacted ? (
            <div className="p-3 rounded-lg bg-red-100 text-center">
              <p className="text-sm text-red-600 font-semibold">
                [REDACTED] — This section will not be visible to the public
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  English
                </label>
                {section.type === "header" ? (
                  <input
                    type="text"
                    value={section.contentEn}
                    onChange={(e) =>
                      updateSection(index, { contentEn: e.target.value })
                    }
                    placeholder="Section heading..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <textarea
                    value={section.contentEn}
                    onChange={(e) =>
                      updateSection(index, { contentEn: e.target.value })
                    }
                    rows={3}
                    placeholder="Paragraph content..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Spanish
                </label>
                {section.type === "header" ? (
                  <input
                    type="text"
                    value={section.contentEs}
                    onChange={(e) =>
                      updateSection(index, { contentEs: e.target.value })
                    }
                    placeholder="Encabezado de sección..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <textarea
                    value={section.contentEs}
                    onChange={(e) =>
                      updateSection(index, { contentEs: e.target.value })
                    }
                    rows={3}
                    placeholder="Contenido del párrafo..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add section buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => addSection("header")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
        >
          <Heading className="w-4 h-4" />
          Add Header
        </button>
        <button
          type="button"
          onClick={() => addSection("paragraph")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Paragraph
        </button>
      </div>
    </div>
  );
}
