"use client";

import { useEffect, useState } from "react";
import type { Permission } from "@/lib/permissions";

interface Props {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client-side permission gate.
 * Fetches the current user's permissions from /api/user/permissions
 * and conditionally renders children.
 *
 * For server components use getAdminWithPermissions() directly.
 */
export default function PermissionGate({
  permission,
  children,
  fallback = null,
}: Props) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/user/permissions")
      .then((r) => r.json())
      .then((data) => {
        setAllowed(
          data.isSuperAdmin || (data.permissions ?? []).includes(permission),
        );
      })
      .catch(() => setAllowed(false));
  }, [permission]);

  if (allowed === null) return null; // Loading — render nothing
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
