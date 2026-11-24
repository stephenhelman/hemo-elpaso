/**
 * What the account button and menu show. PURE: no React, no fetch, so every state is unit-tested
 * (scripts/check-nav.ts). The mode comes from /api/session/access?need=mode (derived on the server per request).
 *
 *   signed out            a sign-in button
 *   board session         "Board", plus "My household" if the person has a linked household
 *   family session        "My household" only. A family session NEVER gets a board link.
 *   signed in, not linked "My household" (it explains that no household was found)
 *   mode not known yet    nothing but Log out (no flash of a link that may be refused)
 */
export type AccountMode = "board" | "family" | "none";
export interface AccountState { mode: AccountMode | null; hasHousehold: boolean }

export interface AccountLink { key: "board" | "household"; href: string }

export function accountLinks(s: AccountState): AccountLink[] {
  if (s.mode === null) return [];
  if (s.mode === "board") {
    const links: AccountLink[] = [{ key: "board", href: "/admin/dashboard" }];
    if (s.hasHousehold) links.push({ key: "household", href: "/portal" });
    return links;
  }
  return [{ key: "household", href: "/portal" }];
}

/** Where the header's sign-in goes. With the family page off it is the board's door; on, everyone's. */
export function signInHref(familyPortalOn: boolean): string {
  return `/api/auth/login?returnTo=${familyPortalOn ? "/portal" : "/admin"}`;
}

export function signInLabel(familyPortalOn: boolean, lang: "en" | "es"): string {
  if (familyPortalOn) return lang === "es" ? "Iniciar sesión" : "Sign in";
  return lang === "es" ? "Inicio de sesión de la junta" : "Board sign-in";
}

/** Parse what /api/session/access?need=mode says (headers). Anything unexpected is "none", never "board". */
export function parseAccess(status: number, mode: string | null, household: string | null): AccountState | null {
  if (status === 401) return null; // signed out
  if (status !== 200) return { mode: "none", hasHousehold: false };
  return { mode: mode === "board" || mode === "family" ? mode : "none", hasHousehold: household === "1" };
}
