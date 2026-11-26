"use client";

import { LanguageProvider } from "@/context/LanguageContext";
import { EventsProvider } from "@/context/EventsContext";
import { UserProvider } from "@auth0/nextjs-auth0/client";

import Navbar from "./Navbar";
import Footer from "./Footer";

import { SiteFlagsProvider } from "@/context/SiteFlagsContext";
import ToastProvider from "@/components/providers/ToastProvider";
import AnnouncementCard from "@/components/announcements/AnnouncementCard";
import type { PublicAnnouncement } from "@/lib/announcements/display";
import { SiteSettingsProvider, type PublicSiteInfo } from "@/context/SiteSettingsContext";
import type { Lang } from "@/types";

function LayoutInner({ children, announcements }: { children: React.ReactNode; announcements: PublicAnnouncement[] }) {
  return (
    <div className="overflow-x-clip">
      <Navbar />
      {children}
      <Footer />
      <AnnouncementCard announcements={announcements} />
    </div>
  );
}

export default function SiteLayout({
  children,
  registrationOpen,
  familyPortal,
  initialLocale,
  siteInfo,
  announcements,
}: {
  children: React.ReactNode;
  registrationOpen: boolean;
  familyPortal: boolean;
  initialLocale: Lang;
  siteInfo: PublicSiteInfo;
  announcements: PublicAnnouncement[];
}) {
  return (
    <SiteFlagsProvider registrationOpen={registrationOpen} familyPortal={familyPortal}>
    <UserProvider>
      <LanguageProvider initialLocale={initialLocale}>
      <SiteSettingsProvider value={siteInfo}>
        <EventsProvider>
          <LayoutInner announcements={announcements}>
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
