"use client";

import { useState } from "react";
import { Languages, Loader2, Edit2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  label: string;
  name: string;
  value: { en: string; es: string };
  onChange: (value: { en: string; es: string }) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  type?: "input" | "textarea";
}

export default function BilingualInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false,
  type = "input",
}: Props) {
  const [inputText, setInputText] = useState("");
  const [showManualEdit, setShowManualEdit] = useState(false);
  const { en, es, isTranslating, translate, setManual } = useTranslation(
    value.en,
    value.es,
  );

  const handleTranslate = async () => {
    const result = await translate(inputText);
    if (result) {
      onChange({ en: result.en, es: result.es });
    }
  };

  const handleManualChange = (field: "en" | "es", newValue: string) => {
    const updated =
      field === "en"
        ? { en: newValue, es: value.es }
        : { en: value.en, es: newValue };

    setManual(updated.en, updated.es);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Input for Translation */}
      <div className="space-y-2">
        {type === "input" ? (
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              placeholder || `Enter ${label.toLowerCase()} in any language...`
            }
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleTranslate();
              }
            }}
          />
        ) : (
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={rows}
            placeholder={
              placeholder || `Enter ${label.toLowerCase()} in any language...`
            }
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )}

        <button
          type="button"
          onClick={handleTranslate}
          disabled={isTranslating || !inputText.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Languages className="w-4 h-4" />
              Translate to Both Languages
            </>
          )}
        </button>
      </div>

      {/* Show Translated Results */}
      {(value.en || value.es) && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-green-800">
              ✓ Translations Ready
            </p>
            <button
              type="button"
              onClick={() => setShowManualEdit(!showManualEdit)}
              className="text-xs text-green-700 hover:text-green-900 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              {showManualEdit ? "Hide" : "Edit Manually"}
            </button>
          </div>

          {showManualEdit ? (
            <>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  English:
                </label>
                <textarea
                  value={value.en}
                  onChange={(e) => handleManualChange("en", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  Spanish:
                </label>
                <textarea
                  value={value.es}
                  onChange={(e) => handleManualChange("es", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-green-700 mb-1">
                  English:
                </p>
                <p className="text-sm text-neutral-900">{value.en}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-green-700 mb-1">
                  Spanish:
                </p>
                <p className="text-sm text-neutral-900">{value.es}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden inputs for form submission */}
      <input type="hidden" name={`${name}En`} value={value.en} />
      <input type="hidden" name={`${name}Es`} value={value.es} />
    </div>
  );
}
