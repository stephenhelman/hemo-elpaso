"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Localized } from "@/sanity/helpers/pick";

/** The few site settings client components need (error page, etc.). Fetched on the server. */
export type PublicSiteInfo = {
  orgName: string;
  tagline?: Localized;
  phone: { display: string; e164: string };
};

const Ctx = createContext<PublicSiteInfo | null>(null);

export function SiteSettingsProvider({ value, children }: { value: PublicSiteInfo; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteInfo(): PublicSiteInfo {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSiteInfo must be used within SiteSettingsProvider");
  return v;
}
