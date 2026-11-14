// src/components/ServerLanguageSwitcher.tsx
"use client";

import { useState } from "react";
import { useLocaleRefresh } from "@/hooks/useLocaleRefresh";
import { useLanguage } from "@/context/LanguageContext";
import { Globe } from "lucide-react";
import { setLocaleCookie } from "@/lib/locale";

interface ServerLanguageSwitcherProps {
  currentLocale: "en" | "es";
}

export default function ServerLanguageSwitcher({
  currentLocale,
}: ServerLanguageSwitcherProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [locale, setLocale] = useState(currentLocale);
  const { setLocale: setContextLocale } = useLanguage();
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
    setContextLocale(newLocale);
    refresh();
    setIsChanging(false);
  }

  return (
    <button
      onClick={toggleLanguage}
      disabled={isChanging}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 hover:border-primary hover:bg-primary-50 transition-colors ${
        isChanging ? "opacity-50 cursor-wait" : ""
      }`}
    >
      <Globe className="w-4 h-4 text-neutral-600" />
      <span className="text-sm font-semibold text-neutral-900 uppercase">
        {locale}
      </span>
    </button>
  );
}
