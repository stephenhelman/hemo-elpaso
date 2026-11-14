"use client";

import { createContext, useContext } from "react";

interface SiteFlags {
  /** REGISTRATION_OPEN, resolved on the server */
  registrationOpen: boolean;
}

const SiteFlagsContext = createContext<SiteFlags>({ registrationOpen: false });

export function SiteFlagsProvider({
  registrationOpen,
  children,
}: SiteFlags & { children: React.ReactNode }) {
  return (
    <SiteFlagsContext.Provider value={{ registrationOpen }}>
      {children}
    </SiteFlagsContext.Provider>
  );
}

export const useSiteFlags = () => useContext(SiteFlagsContext);
