"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, LogOut, Shield } from "lucide-react";
import { Lang } from "@/types";
import { userMenuTranslation } from "@/translation/layoutPage";
import { useSiteFlags } from "@/context/SiteFlagsContext";
import { accountLinks, parseAccess, signInHref, signInLabel, type AccountState } from "@/lib/nav/account";

/**
 * Sign-in button for the top nav. Desktop (lg+) it sits in the bar; below lg it lives in the mobile menu
 * (`variant="mobile"`), so the bar keeps room for the language switcher, the CTA and the menu button.
 * A plain <a>: /api/auth/login is an API route, not a client-side navigation.
 */
export function SignInLink({ lang, familyPortal, variant, onClick }: { lang: Lang; familyPortal: boolean; variant: "desktop" | "mobile"; onClick?: () => void }) {
  return (
    <a
      href={signInHref(familyPortal)}
      onClick={onClick}
      title={lang === "es" ? "Inicie sesión con Google, Apple o Facebook, o reciba un código por correo" : "Log in with Google, Apple or Facebook, or get a code by email"}
      className={
        variant === "desktop"
          ? "hidden lg:inline-flex items-center px-3 py-2 rounded-full border border-neutral-300 text-neutral-700 text-sm font-semibold whitespace-nowrap hover:border-primary hover:text-primary transition-colors duration-200"
          : "lg:hidden mx-3 mt-2 mb-1 inline-flex items-center justify-center px-4 py-2.5 rounded-full border border-neutral-300 text-neutral-700 text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
      }
    >
      {signInLabel(lang)}
    </a>
  );
}

/** The open dropdown's contents. Pure props, so each session type is rendered and checked in scripts/check-nav.ts. */
export function AccountMenuItems({ lang, user, access, onNavigate }: { lang: Lang; user: { name?: string | null; email?: string | null }; access: AccountState; onNavigate?: () => void }) {
  const t = userMenuTranslation[lang];
  const links = accountLinks(access);
  return (
    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-neutral-200 shadow-lg z-50">
      <div className="p-3 border-b border-neutral-100">
        <p className="text-sm font-semibold text-neutral-900 truncate">{user.name}</p>
        <p className="text-xs text-neutral-500 truncate">{user.email}</p>
      </div>
      {links.length > 0 && (
        <div className="py-2">
          {links.map((l) =>
            l.key === "board" ? (
              <Link key={l.key} href={l.href} onClick={onNavigate}
                className="flex items-center gap-2 px-4 py-2 text-sm transition-all bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg">
                <Shield className="w-4 h-4" />
                {t.board}
              </Link>
            ) : (
              <Link key={l.key} href={l.href} onClick={onNavigate}
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                <Home className="w-4 h-4" />
                {t.myHousehold}
              </Link>
            ),
          )}
        </div>
      )}
      <div className="border-t border-neutral-100 py-2">
        <a href="/api/auth/logout" onClick={onNavigate} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" />
          {t.logout}
        </a>
      </div>
    </div>
  );
}

interface Props {
  lang: Lang;
  /** Show the sign-in button when nobody is signed in (the site header). The portal bar has its own. */
  showSignIn?: boolean;
}

export default function UserMenu({ lang, showSignIn = false }: Props) {
  const { user, isLoading } = useUser();
  const { familyPortal } = useSiteFlags();
  const [isOpen, setIsOpen] = useState(false);
  const [access, setAccess] = useState<AccountState>({ mode: null, hasHousehold: false });

  // What the signed-in person is (board / family) is asked of the server, never guessed from the Auth0 profile.
  const signedIn = !!user;
  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    fetch("/api/session/access?need=mode", { cache: "no-store" })
      .then((r) => parseAccess(r.status, r.headers.get("x-hoep-mode"), r.headers.get("x-hoep-household")))
      .then((a) => { if (live && a) setAccess(a); })
      .catch(() => { if (live) setAccess({ mode: "none", hasHousehold: false }); });
    return () => { live = false; };
  }, [signedIn]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".user-menu-container")) setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (isLoading) return <div className="w-8 h-8 rounded-full bg-neutral-100 animate-pulse" />;
  if (!user) return showSignIn ? <SignInLink lang={lang} familyPortal={familyPortal} variant="desktop" /> : null;

  return (
    <div className="relative user-menu-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-2 p-1 xl:px-3 xl:py-1.5 rounded-full border border-neutral-200 hover:border-primary transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
          <span className="text-white text-xs font-bold">{user.name?.charAt(0).toUpperCase() || "U"}</span>
        </div>
        <span className="hidden xl:block text-sm font-medium text-neutral-700 max-w-[100px] truncate">{user.name?.split(" ")[0] || "User"}</span>
      </button>
      {isOpen && <AccountMenuItems lang={lang} user={user} access={access} onNavigate={() => setIsOpen(false)} />}
    </div>
  );
}
