"use client";

import { createContext, useContext } from "react";

interface SiteFlags {
  /** REGISTRATION_OPEN, resolved on the server */
  registrationOpen: boolean;
  /** family_portal toggle (feature switchboard), resolved on the server: changes the header sign-in label */
  familyPortal: boolean;
}

const SiteFlagsContext = createContext<SiteFlags>({ registrationOpen: false, familyPortal: false });

export function SiteFlagsProvider({
  registrationOpen,
  familyPortal,
  children,
}: SiteFlags & { children: React.ReactNode }) {
  return (
    <SiteFlagsContext.Provider value={{ registrationOpen, familyPortal }}>
      {children}
    </SiteFlagsContext.Provider>
  );
}

export const useSiteFlags = () => useContext(SiteFlagsContext);
