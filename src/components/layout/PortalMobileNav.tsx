"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  DollarSign,
  User,
  LogOut,
  Shield,
  Home,
} from "lucide-react";
import Image from "next/image";

interface Props {
  isAdmin?: boolean;
}
export default function PortalMobileNav({ isAdmin = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/portal/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Events",
      href: "/portal/events",
      icon: Calendar,
    },
    {
      name: "Financial Assistance",
      href: "/portal/assistance",
      icon: DollarSign,
    },
    {
      name: "My Profile",
      href: "/portal/profile",
      icon: User,
    },
  ];

  return (
    <>
      {/* Mobile Header - Only visible on small screens */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/portal/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Hemophilia Outreach of El Paso"
              width={40}
              height={40}
              className="rounded-full object-contain"
            />
            <span className="font-display font-bold text-lg text-neutral-900">
              HOEP
            </span>
          </Link>

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
              Menu
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
            {navItems.map((item) => {
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
                  {item.name}
                </Link>
              );
            })}
            {isAdmin && (
              <>
                {/* Divider */}
                <div className="py-2">
                  <div className="h-px bg-neutral-200" />
                </div>

                {/* Admin Link - Special styling */}
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="
                    flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all
                    bg-gradient-to-r from-purple-600 to-purple-700
                    text-white
                    hover:from-purple-700 hover:to-purple-800
                    shadow-md hover:shadow-lg
                  "
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin Dashboard</span>
                  <div className="ml-auto">
                    <div className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                      ADMIN
                    </div>
                  </div>
                </Link>
              </>
            )}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-neutral-200">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-neutral-100 font-medium transition-colors w-full"
            >
              <Home className="w-5 h-5" />
              Back to Website
            </Link>
            <a
              href="/api/auth/logout"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </a>
          </div>
        </div>
      </div>

      {/* Spacer - prevents content from going under fixed header */}
      <div className="lg:hidden h-14" />
    </>
  );
}
