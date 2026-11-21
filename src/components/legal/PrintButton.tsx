"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

const label = { en: "Print / Save as PDF", es: "Imprimir / Guardar como PDF" } as const;

/** Prints the page in the language currently showing. */
export default function PrintButton({ locale }: { locale: "en" | "es" }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
    >
      <Printer className="h-4 w-4" aria-hidden="true" /> {label[locale]}
    </button>
  );
}

/** Opens the print dialog once when the page was reached from the /legal index "Print" links (?print=1). */
export function AutoPrint({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => window.print(), 400); // let fonts/layout settle
    return () => clearTimeout(t);
  }, [enabled]);
  return null;
}
