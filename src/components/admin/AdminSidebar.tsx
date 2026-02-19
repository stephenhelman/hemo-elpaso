"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  LogOut,
  Home,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  user: {
    name?: string;
    email?: string;
  };
}

const navItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Events",
    href: "/admin/events",
    icon: Calendar,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "Attendance",
    href: "/admin/attendance",
    icon: CheckCircle,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar({ user }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-neutral-900 border-r border-neutral-800">
      <div className="flex flex-col flex-1">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-800">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">
              HO
            </span>
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-tight">
              Admin Portal
            </p>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-neutral-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white",
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-neutral-800 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Website
          </Link>
          <a
            href="/api/auth/logout"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </a>
        </div>
      </div>
    </aside>
  );
}
