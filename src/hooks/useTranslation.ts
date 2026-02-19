"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface TranslationState {
  en: string;
  es: string;
  originalLang: string;
  isTranslating: boolean;
}

export function useTranslation(initialEn: string = "", initialEs: string = "") {
  const [state, setState] = useState<TranslationState>({
    en: initialEn,
    es: initialEs,
    originalLang: "en",
    isTranslating: false,
  });

  const translate = async (text: string) => {
    if (!text.trim()) {
      toast.error("Please enter text to translate");
      return;
    }

    setState((prev) => ({ ...prev, isTranslating: true }));

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const data = await response.json();
        setState({
          en: data.en,
          es: data.es,
          originalLang: data.originalLang,
          isTranslating: false,
        });
        toast.success("Translation complete!");
        return data;
      } else {
        const data = await response.json();
        toast.error(data.error || "Translation failed");
        setState((prev) => ({ ...prev, isTranslating: false }));
      }
    } catch (error: any) {
      toast.error(error.message || "Translation failed");
      setState((prev) => ({ ...prev, isTranslating: false }));
    }
  };

  const setManual = (en: string, es: string) => {
    setState((prev) => ({
      ...prev,
      en,
      es,
    }));
  };

  const reset = () => {
    setState({
      en: "",
      es: "",
      originalLang: "en",
      isTranslating: false,
    });
  };

  return {
    ...state,
    translate,
    setManual,
    reset,
  };
}
