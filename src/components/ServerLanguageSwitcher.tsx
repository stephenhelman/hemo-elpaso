// src/components/ServerLanguageSwitcher.tsx
"use client";

import { useState } from "react";
import { useLocaleRefresh } from "@/hooks/useLocaleRefresh";
import { useOptionalLanguage } from "@/context/LanguageContext";
import { Globe } from "lucide-react";
import { setLocaleCookie } from "@/lib/locale";

interface ServerLanguageSwitcherProps {
  currentLocale: "en" | "es";
  /** "dark" for the dark admin sidebar. */
  tone?: "light" | "dark";
}

export default function ServerLanguageSwitcher({
  currentLocale,
  tone = "light",
}: ServerLanguageSwitcherProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [locale, setLocale] = useState(currentLocale);
  // Admin/portal layouts have no LanguageProvider; public pages do.
  const languageContext = useOptionalLanguage();
  const { refresh } = useLocaleRefresh();

  async function toggleLanguage() {
    if (isChanging) return;

    const newLocale = locale === "en" ? "es" : "en";
    setIsChanging(true);

    // Optimistically update UI
    setLocale(newLocale);

    // Set cookie
    await setLocaleCookie(newLocale);
    // Keep client pages (LanguageContext) in step, then re-render server components
    // without a reload; the current page stays visible until the new render arrives.
    languageContext?.setLocale(newLocale);
    refresh();
    setIsChanging(false);
  }

  return (
    <button
      onClick={toggleLanguage}
      disabled={isChanging}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
        tone === "dark"
          ? "border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800"
          : "border-neutral-300 hover:border-primary hover:bg-primary-50"
      } ${
        isChanging ? "opacity-50 cursor-wait" : ""
      }`}
    >
      <Globe className={`w-4 h-4 ${tone === "dark" ? "text-neutral-400" : "text-neutral-600"}`} />
      <span className={`text-sm font-semibold uppercase ${tone === "dark" ? "text-white" : "text-neutral-900"}`}>
        {locale}
      </span>
    </button>
  );
}
