"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import ServerLanguageSwitcher from "../ServerLanguageSwitcher";
import { useSiteFlags } from "@/context/SiteFlagsContext";

const navLinks = [
  { href: "/", labelEn: "Home", labelEs: "Inicio" },
  { href: "/about", labelEn: "About Us", labelEs: "Nosotros" },
  { href: "/events", labelEn: "Events", labelEs: "Eventos" },
  { href: "/resources", labelEn: "Resources", labelEs: "Recursos" },
  { href: "/scholarships", labelEn: "Scholarships", labelEs: "Becas" },
  {
    href: "/register-info",
    labelEn: "Get Information",
    labelEs: "Recibir Información",
  },
  { href: "/contact", labelEn: "Contact", labelEs: "Contacto" },
];

export default function Navbar() {
  const { registrationOpen } = useSiteFlags();
  const links = navLinks.filter((l) => registrationOpen || l.href !== "/register-info");
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
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <BrandMark tone="light" iconHeight={40} hideTextBelowSm />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                  pathname === link.href
                    ? "text-primary bg-primary-50 font-semibold"
                    : "text-neutral-600 hover:text-primary hover:bg-primary-50",
                )}
              >
                {locale === "en" ? link.labelEn : link.labelEs}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isPortalOrAdmin ? (
              <ServerLanguageSwitcher currentLocale={locale} />
            ) : (
              <LanguageSwitcher />
            )}

            <UserMenu lang={locale} />

            {/* Get Involved CTA */}
            <Link
              href="/get-involved"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors duration-200"
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
            <nav className="flex flex-col px-4 py-3 gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-md text-sm font-medium text-neutral-600 hover:text-primary hover:bg-primary-50 transition-colors"
                >
                  {locale === "en" ? link.labelEn : link.labelEs}
                </Link>
              ))}
              <div className="pt-2 border-t border-neutral-100 mt-1 space-y-2">
                {/* Sign In Button - Only show if not logged in */}
                <MobileSignInButton
                  lang={locale}
                  onClose={() => setMobileOpen(false)}
                />

                <Link
                  href="/get-involved"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
                >
                  {locale === "en" ? "Get Involved" : "Participa"}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function MobileSignInButton({
  lang,
  onClose,
}: {
  lang: "en" | "es";
  onClose: () => void;
}) {
  const { user, isLoading } = useUser();

  if (isLoading || user) {
    return null; // Don't show if loading or already logged in
  }

  return (
    <Link
      href="/api/auth/login?returnTo=/admin"
      onClick={onClose}
      className="flex items-center justify-center px-4 py-2.5 rounded-full border-2 border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
    >
      {lang === "en" ? "Sign In" : "Iniciar Sesión"}
    </Link>
  );
}
