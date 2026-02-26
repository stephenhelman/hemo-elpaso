"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, Home, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import {
  adminSidebarTranslation,
  adminNavItemsTranslation,
} from "@/translation/adminSidebar";
import LanguageSwitcher from "../LanguageSwitcher";

export default function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { locale } = useLanguage();
  const t = adminSidebarTranslation[locale];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Hemophilia Outreach of El Paso"
              width={40}
              height={40}
              className="rounded-full object-contain"
            />
            <span className="font-display font-bold text-lg text-neutral-900">
              HOEP Admin
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-6 h-6 text-neutral-900" />
              ) : (
                <Menu className="w-6 h-6 text-neutral-900" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`
          lg:hidden fixed top-0 right-0 bottom-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <span className="font-display font-bold text-lg text-neutral-900">
              {t.menu}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-600" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {adminNavItemsTranslation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors
                    ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item[locale]}
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-neutral-200 space-y-2">
            <Link
              href="/portal/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-neutral-100 font-medium transition-colors w-full"
            >
              <LayoutDashboard className="w-5 h-5" />
              {t.patientPortal}
            </Link>
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-neutral-100 font-medium transition-colors w-full"
            >
              <Home className="w-5 h-5" />
              {t.backToWebsite}
            </Link>
            <a
              href="/api/auth/logout"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              {t.logout}
            </a>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="lg:hidden h-14" />
    </>
  );
}
