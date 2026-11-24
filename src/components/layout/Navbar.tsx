"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import UserMenu, { SignInLink } from "./UserMenu";
import { useUser } from "@auth0/nextjs-auth0/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import ServerLanguageSwitcher from "../ServerLanguageSwitcher";
import { useSiteFlags } from "@/context/SiteFlagsContext";

type NavLeaf = { href: string; labelEn: string; labelEs: string };
type NavItem = NavLeaf | { labelEn: string; labelEs: string; children: NavLeaf[] };

/**
 * Top-level items stay few enough to fit a 1024px laptop: Photos live under
 * Events, Scholarships under Resources. "Home" is the logo. Sign-in is the outlined button before the CTA
 * (desktop) or the last row of the mobile menu; once signed in it becomes the avatar menu.
 */
const navItems: NavItem[] = [
  { href: "/about", labelEn: "About Us", labelEs: "Nosotros" },
  {
    labelEn: "Events",
    labelEs: "Eventos",
    children: [
      { href: "/events", labelEn: "All events", labelEs: "Todos los eventos" },
      { href: "/gallery", labelEn: "Photos", labelEs: "Fotos" },
    ],
  },
  {
    labelEn: "Resources",
    labelEs: "Recursos",
    children: [
      { href: "/resources", labelEn: "Resource guide", labelEs: "Guía de recursos" },
      { href: "/scholarships", labelEn: "Scholarships", labelEs: "Becas" },
    ],
  },
  { href: "/register-info", labelEn: "Get Information", labelEs: "Recibir Información" },
  { href: "/contact", labelEn: "Contact", labelEs: "Contacto" },
];

const isGroup = (i: NavItem): i is Extract<NavItem, { children: NavLeaf[] }> => "children" in i;
const matches = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + "/");

const linkBase = "px-2 xl:px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors duration-200";
const linkState = (active: boolean) =>
  active ? "text-primary bg-primary-50 font-semibold" : "text-neutral-600 hover:text-primary hover:bg-primary-50";

/**
 * Desktop dropdown. Opens on click, Enter/Space/ArrowDown (keyboard and touch),
 * and on mouse hover as a convenience. Esc or clicking elsewhere closes it.
 */
function NavDropdown({ item, pathname, locale }: { item: Extract<NavItem, { children: NavLeaf[] }>; pathname: string; locale: "en" | "es" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = item.children.some((c) => matches(pathname, c.href));
  const label = locale === "en" ? item.labelEn : item.labelEs;

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setOpen(true); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") setOpen(false); }}
      onKeyDown={(e) => {
        if (e.key === "Escape") { setOpen(false); (ref.current?.querySelector("button") as HTMLElement | null)?.focus(); }
        if (e.key === "ArrowDown" && !open) { e.preventDefault(); setOpen(true); }
      }}
      onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false); }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(linkBase, "inline-flex items-center gap-1", linkState(active))}
      >
        {label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        // pt-1 bridges the gap so moving the mouse down doesn't close the menu
        <div className="absolute left-0 top-full pt-1 z-50 min-w-[11rem]">
          <ul role="menu" className="rounded-xl border border-neutral-200 bg-white shadow-lg py-1.5">
            {item.children.map((c) => (
              <li key={c.href} role="none">
                <Link
                  role="menuitem"
                  href={c.href}
                  className={cn(
                    "block px-4 py-2 text-sm whitespace-nowrap",
                    matches(pathname, c.href) ? "text-primary font-semibold bg-primary-50" : "text-neutral-700 hover:bg-neutral-50 hover:text-primary",
                  )}
                >
                  {locale === "en" ? c.labelEn : c.labelEs}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { registrationOpen, familyPortal } = useSiteFlags();
  const { user, isLoading } = useUser();
  const items = navItems.filter((i) => isGroup(i) || registrationOpen || i.href !== "/register-info");
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { locale } = useLanguage();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isPortalOrAdmin =
    pathname.startsWith("/portal") || pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-neutral-200 shadow-sm">
      <div className="container-max">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-6 xl:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <BrandMark tone="light" iconHeight={40} hideTextBelowSm />
          </Link>

          {/* Desktop nav (laptops and up). Below lg the same items live in the menu. */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 ml-2 xl:ml-8" aria-label={locale === "en" ? "Main" : "Principal"}>
            {items.map((item) =>
              isGroup(item) ? (
                <NavDropdown key={item.labelEn} item={item} pathname={pathname} locale={locale} />
              ) : (
                <Link key={item.href} href={item.href} className={cn(linkBase, linkState(pathname === item.href))}>
                  {locale === "en" ? item.labelEn : item.labelEs}
                </Link>
              ),
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isPortalOrAdmin ? (
              <ServerLanguageSwitcher currentLocale={locale} />
            ) : (
              <LanguageSwitcher />
            )}

            <UserMenu lang={locale} showSignIn />

            {/* Get Involved CTA */}
            <Link
              href="/get-involved"
              className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold whitespace-nowrap hover:bg-primary-600 transition-colors duration-200"
            >
              {locale === "en" ? "Get Involved" : "Participa"}
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-md text-neutral-600 hover:text-primary hover:bg-neutral-100 transition-colors"
              aria-label={locale === "en" ? "Toggle menu" : "Abrir o cerrar menú"}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-neutral-200 bg-white">
            <nav className="flex flex-col px-4 py-3 gap-1" aria-label={locale === "en" ? "Main" : "Principal"}>
              {items.map((item) =>
                isGroup(item) ? (
                  <div key={item.labelEn} className="pt-1">
                    <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      {locale === "en" ? item.labelEn : item.labelEs}
                    </p>
                    {item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-2.5 pl-6 rounded-md text-sm font-medium text-neutral-600 hover:text-primary hover:bg-primary-50 transition-colors"
                      >
                        {locale === "en" ? c.labelEn : c.labelEs}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2.5 rounded-md text-sm font-medium text-neutral-600 hover:text-primary hover:bg-primary-50 transition-colors"
                  >
                    {locale === "en" ? item.labelEn : item.labelEs}
                  </Link>
                ),
              )}
              {!user && !isLoading && (
                <SignInLink lang={locale} familyPortal={familyPortal} variant="mobile" onClick={() => setMobileOpen(false)} />
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
