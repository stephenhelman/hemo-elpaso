"use client";

import { useLanguage } from "@/context/LanguageContext";
import { registerInfoTranslation } from "@/translation/registerInfoPage";

export default function RegisterInfoHeading() {
  const { locale } = useLanguage();
  const t = registerInfoTranslation[locale];
  return (
    <div className="mb-8 text-center">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
        {t.title}
      </h1>
      <p className="text-neutral-600">{t.intro}</p>
    </div>
  );
}
