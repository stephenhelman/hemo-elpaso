"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState<"en" | "es">("en");

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "es" : "en"));
  };

  return (
    <>
      <Navbar lang={lang} onLanguageToggle={toggleLanguage} />
      <main>{children}</main>
      <Footer lang={lang} />
    </>
  );
}
