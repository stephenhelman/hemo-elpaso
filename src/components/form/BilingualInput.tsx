"use client";

import { Languages, Loader2 } from "lucide-react";
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

/**
 * Two real fields (English / Spanish) bound directly to the parent's state, so
 * whatever is typed is what gets saved. Translate is an optional helper: it
 * fills the other language from whichever one has text. English alone is enough
 * (the API falls back to it for a blank Spanish field).
 */
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
  const { isTranslating, translate } = useTranslation();
  const en = value.en ?? "";
  const es = value.es ?? "";

  const handleTranslate = async () => {
    const source = en.trim() ? en : es;
    const result = await translate(source);
    if (result) onChange({ en: result.en, es: result.es });
  };

  const field = (lang: "en" | "es", text: string) => {
    const common = {
      value: text,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange({ en, es, [lang]: e.target.value }),
      className:
        "w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary",
    };
    return type === "input" ? (
      <input type="text" required={required && lang === "en"} placeholder={placeholder} {...common} />
    ) : (
      <textarea rows={rows} required={required && lang === "en"} placeholder={placeholder} {...common} />
    );
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div>
        <p className="text-xs font-medium text-neutral-500 mb-1">English{required ? " (required)" : ""}</p>
        {field("en", en)}
      </div>
      <div>
        <p className="text-xs font-medium text-neutral-500 mb-1">Spanish (optional; uses English if left blank)</p>
        {field("es", es)}
      </div>

      <button
        type="button"
        onClick={handleTranslate}
        disabled={isTranslating || (!en.trim() && !es.trim())}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {isTranslating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Translating...
          </>
        ) : (
          <>
            <Languages className="w-4 h-4" /> Translate (fills the other language)
          </>
        )}
      </button>

      <input type="hidden" name={`${name}En`} value={en} />
      <input type="hidden" name={`${name}Es`} value={es} />
    </div>
  );
}
