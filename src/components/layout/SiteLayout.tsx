"use client";

import { LanguageProvider } from "@/context/LanguageContext";
import { EventsProvider } from "@/context/EventsContext";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import Navbar from "./Navbar";
import Footer from "./Footer";

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
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
}
