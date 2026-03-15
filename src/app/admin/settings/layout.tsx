"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Mail, Users, Building2, Shield } from "lucide-react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "General",
      href: "/admin/settings",
      icon: Building2,
      disabled: false,
    },
    {
      name: "Email Templates",
      href: "/admin/settings/email-templates",
      icon: Mail,
      disabled: false,
    },
    {
      name: "Board Management",
      href: "/admin/settings/board",
      icon: Users,
      disabled: false,
    },
    {
      name: "Roles & Permissions",
      href: "/admin/settings/roles",
      icon: Shield,
      disabled: true,
    },
  ];

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Settings
          </h1>
        </div>
        <p className="text-neutral-600">
          Manage your organization settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 mb-8">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== "/admin/settings" && pathname.startsWith(tab.href));
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.disabled ? "#" : tab.href}
                className={`
                  flex items-center gap-2 pb-4 border-b-2 transition-colors whitespace-nowrap
                  ${
                    isActive
                      ? "border-primary text-primary font-semibold"
                      : tab.disabled
                        ? "border-transparent text-neutral-400 cursor-not-allowed"
                        : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
                  }
                `}
                onClick={(e) => tab.disabled && e.preventDefault()}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
                {tab.disabled && (
                  <span className="text-xs text-neutral-400 ml-1">(soon)</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
