"use client";

import { useLocaleRefresh } from "@/hooks/useLocaleRefresh";
import { useLanguage } from "@/context/LanguageContext";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const { refresh, isPending } = useLocaleRefresh();

  const toggleLanguage = () => {
    // Sets the cookie synchronously and updates client pages via context...
    setLocale(locale === "en" ? "es" : "en");
    // ...and re-renders server components. The current page stays on screen
    // until the new render arrives; scroll position is preserved.
    refresh();
  };

  return (
    <button
      onClick={toggleLanguage}
      aria-busy={isPending}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 hover:border-primary hover:bg-primary-50 transition-colors ${
        isPending ? "opacity-70" : ""
      }`}
    >
      <Globe className="w-4 h-4 text-neutral-600" />
      <span className="text-sm font-semibold text-neutral-900 uppercase">
        {locale}
      </span>
    </button>
  );
}
