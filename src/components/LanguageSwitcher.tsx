"use client";

import { useLang } from "@/context/LanguageContext";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const toggleLanguage = () => {
    setLang(lang === "en" ? "es" : "en");
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 hover:border-primary hover:bg-primary-50 transition-colors"
    >
      <Globe className="w-4 h-4 text-neutral-600" />
      <span className="text-sm font-semibold text-neutral-900 uppercase">
        {lang}
      </span>
    </button>
  );
}
