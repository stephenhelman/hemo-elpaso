"use client";

import { LanguageProvider } from "@/context/LanguageContext";
import { EventsProvider } from "@/context/EventsContext";
import { UserProvider } from "@auth0/nextjs-auth0/client";

import Navbar from "./Navbar";
import Footer from "./Footer";

import { SiteFlagsProvider } from "@/context/SiteFlagsContext";
import ToastProvider from "@/components/providers/ToastProvider";
import { SiteSettingsProvider, type PublicSiteInfo } from "@/context/SiteSettingsContext";
import type { Lang } from "@/types";

function LayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-clip">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

export default function SiteLayout({
  children,
  registrationOpen,
  initialLocale,
  siteInfo,
}: {
  children: React.ReactNode;
  registrationOpen: boolean;
  initialLocale: Lang;
  siteInfo: PublicSiteInfo;
}) {
  return (
    <SiteFlagsProvider registrationOpen={registrationOpen}>
    <UserProvider>
      <LanguageProvider initialLocale={initialLocale}>
      <SiteSettingsProvider value={siteInfo}>
        <EventsProvider>
          <LayoutInner>
            {children}
            <ToastProvider />
          </LayoutInner>
        </EventsProvider>
      </SiteSettingsProvider>
      </LanguageProvider>
    </UserProvider>
    </SiteFlagsProvider>
  );
}
