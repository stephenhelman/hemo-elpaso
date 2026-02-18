"use client";

import { LanguageProvider } from "@/context/LanguageContext";
import { EventsProvider } from "@/context/EventsContext";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useLang } from "@/context/LanguageContext";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useLang();

  return (
    <div className="overflow-x-hidden">
      <Navbar
        lang={lang}
        onLanguageToggle={() => setLang(lang === "en" ? "es" : "en")}
      />
      {children}
      <Footer lang={lang} />
    </div>
  );
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <LanguageProvider>
        <EventsProvider>
          <LayoutInner>{children}</LayoutInner>
        </EventsProvider>
      </LanguageProvider>
    </UserProvider>
  );
}
