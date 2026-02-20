"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Calendar,
  User,
  LogOut,
  Home,
  Shield,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PortalMobileNav from "../layout/PortalMobileNav";

interface Props {
  user: {
    name?: string;
    email?: string;
    picture?: string;
    role?: string; // ADD THIS
  };
}

const navItems = [
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/events", label: "Events", icon: Calendar },
  { href: "/portal/profile", label: "Profile", icon: User },
  {
    href: "/portal/assistance",
    label: "Financial Assistance",
    icon: DollarSign,
  },
];

export default function PortalSidebar({ user }: Props) {
  const pathname = usePathname();
  const isAdmin = user.role === "board" || user.role === "admin";

  return (
    <>
      <PortalMobileNav isAdmin={isAdmin} />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-neutral-200">
        <div className="flex flex-col flex-1">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-200">
            <Image
              src="/logo.png"
              alt="Hemophilia Outreach of El Paso"
              width={40}
              height={40}
              className="rounded-full object-contain"
            />
            <div>
              <p className="font-display font-bold text-neutral-900 text-sm leading-tight">
                Patient Portal
              </p>
            </div>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}

            {/* Admin Dashboard Link */}
            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-neutral-200">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-700
                    text-white
                    hover:from-purple-700 hover:to-purple-800
                    shadow-md hover:shadow-lg"
                >
                  <Shield className="w-5 h-5" />
                  Admin Dashboard
                </Link>
              </div>
            )}
          </nav>

          {/* Bottom actions */}
          <div className="p-3 border-t border-neutral-100 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
            >
              <Home className="w-5 h-5" />
              Back to Website
            </Link>
            <a
              href="/api/auth/logout"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
