"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import Cookies from "js-cookie";

type Locale = "en" | "es";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeLocale() {
      // 1. Check if cookie exists
      const cookieLocale = Cookies.get("locale") as Locale | undefined;

      if (cookieLocale) {
        // Cookie exists - use it
        setLocaleState(cookieLocale);
        setIsLoading(false);
        return;
      }

      // 2. No cookie - try to sync from DB (for logged-in users)
      try {
        const response = await fetch("/api/user/set-locale");

        if (response.ok) {
          const data = await response.json();
          setLocaleState(data.locale);
          // Cookie is set by the API route
        } else {
          // Not logged in or error - default to 'en' and set cookie
          setLocaleState("en");
          Cookies.set("locale", "en", {
            expires: 365,
            path: "/",
            sameSite: "lax",
          });
        }
      } catch (error) {
        // Error fetching - default to 'en' and set cookie
        console.error("Failed to fetch locale:", error);
        setLocaleState("en");
        Cookies.set("locale", "en", {
          expires: 365,
          path: "/",
          sameSite: "lax",
        });
      }

      setIsLoading(false);
    }

    initializeLocale();
  }, []);

  const setLocale = (newLocale: Locale) => {
    // Update state
    setLocaleState(newLocale);

    // Update cookie
    Cookies.set("locale", newLocale, {
      expires: 365,
      path: "/",
      sameSite: "lax",
    });
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
