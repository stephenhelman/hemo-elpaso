"use client";

import { LanguageProvider } from "@/context/LanguageContext";
import { EventsProvider } from "@/context/EventsContext";
import { UserProvider } from "@auth0/nextjs-auth0/client";

import Navbar from "./Navbar";
import Footer from "./Footer";

import { SiteFlagsProvider } from "@/context/SiteFlagsContext";
import ToastProvider from "@/components/providers/ToastProvider";

function LayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

export default function SiteLayout({
  children,
  registrationOpen,
}: {
  children: React.ReactNode;
  registrationOpen: boolean;
}) {
  return (
    <SiteFlagsProvider registrationOpen={registrationOpen}>
    <UserProvider>
      <LanguageProvider>
        <EventsProvider>
          <LayoutInner>
            {children}
            <ToastProvider />
          </LayoutInner>
        </EventsProvider>
      </LanguageProvider>
    </UserProvider>
    </SiteFlagsProvider>
  );
}
