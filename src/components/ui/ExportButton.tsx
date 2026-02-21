"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface ExportButtonProps {
  // Client-side CSV mode
  headers?: string[];
  rows?: (string | number)[][];
  customCsv?: string;
  // API-based export mode
  apiEndpoint?: string;
  apiParams?: Record<string, string>;
  // Common
  filename: string;
  disabled?: boolean;
  className?: string;
}

export default function ExportButton({
  headers,
  rows,
  customCsv,
  apiEndpoint,
  apiParams,
  filename,
  disabled,
  className,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (apiEndpoint) {
      setLoading(true);
      try {
        const url = new URL(apiEndpoint, window.location.origin);
        if (apiParams) {
          Object.entries(apiParams).forEach(([k, v]) => {
            if (v && v !== "all") url.searchParams.set(k, v);
          });
        }
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Export failed");
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(blobUrl);
      } finally {
        setLoading(false);
      }
      return;
    }

    const csv = customCsv
      ? customCsv
      : [
          (headers ?? []).join(","),
          ...(rows ?? []).map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isDisabled =
    disabled ||
    loading ||
    (!apiEndpoint && !customCsv && (!rows || rows.length === 0));

  return (
    <button
      onClick={handleExport}
      disabled={isDisabled}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${className ?? ""}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Export CSV
    </button>
  );
}
