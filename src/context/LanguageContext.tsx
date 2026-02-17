"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Lang } from "@/types";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const defaultValue: LanguageContextType = {
  lang: "en",
  setLang: () => {},
};

const LanguageContext = createContext<LanguageContextType>(defaultValue);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): LanguageContextType {
  const context = useContext(LanguageContext);
  return context ?? defaultValue;
}
