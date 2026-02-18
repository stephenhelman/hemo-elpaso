"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, User, LayoutDashboard, Shield } from "lucide-react";

export default function UserMenu() {
  const { user, isLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    if (user) {
      // Check if user is admin/board
      fetch("/api/user/role")
        .then((res) => res.json())
        .then((data) => {
          setIsAdmin(data.role === "admin" || data.role === "board");
          setCheckingRole(false);
        })
        .catch(() => setCheckingRole(false));
    } else {
      setCheckingRole(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-neutral-100 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/api/auth/login"
        className="hidden sm:inline-flex items-center px-4 py-2 rounded-full border-2 border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-colors duration-200"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="relative group">
      {/* User avatar button */}
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200 hover:border-primary transition-colors">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>
        <span className="hidden sm:block text-sm font-medium text-neutral-700 max-w-[100px] truncate">
          {user.name?.split(" ")[0] || "User"}
        </span>
      </button>

      {/* Dropdown menu */}
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-neutral-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-3 border-b border-neutral-100">
          <p className="text-sm font-semibold text-neutral-900 truncate">
            {user.name}
          </p>
          <p className="text-xs text-neutral-500 truncate">{user.email}</p>
        </div>
        <div className="py-2">
          <Link
            href="/portal/dashboard"
            className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/portal/profile"
            className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <User className="w-4 h-4" />
            Profile
          </Link>

          {/* Admin Dashboard Link */}
          {!checkingRole && isAdmin && (
            <>
              <div className="border-t border-neutral-100 my-2" />
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-sm bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </Link>
            </>
          )}
        </div>
        <div className="border-t border-neutral-100 py-2">
          <a
            href="/api/auth/logout"
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </a>
        </div>
      </div>
    </div>
  );
}
