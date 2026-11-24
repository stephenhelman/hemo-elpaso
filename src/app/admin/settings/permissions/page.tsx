import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { getLocaleCookie } from "@/lib/locale";
import { prisma } from "@/lib/db";
import { PERMISSION_CATALOG, ROLE_KEYS } from "@/lib/permission-catalog";
import { LOCK_TEXT, cellLock } from "@/lib/permission-rules";
import { readMatrixFresh } from "@/lib/permission-matrix";
import PermissionsClient from "./PermissionsClient";
import type { Lang } from "@/types";

export const dynamic = "force-dynamic";

export default async function PermissionsPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManagePermissions")) redirect("/admin/dashboard");

  const locale: Lang = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  let loadError = false;
  let matrix = (await readMatrixFresh().catch(() => { loadError = true; return null; }))?.matrix;
  if (!matrix) matrix = (await import("@/lib/permission-catalog")).DEFAULT_MATRIX;

  // Does anyone currently hold President or Vice President? (Warning only; the saved-matrix rule is separate.)
  const officersAssigned = await prisma.boardRole.count({ where: { active: true, role: { in: ["PRESIDENT", "VICE_PRESIDENT"] } } });

  const perms = PERMISSION_CATALOG.map((p) => ({ key: p.key, label: p.label[locale], category: p.category, phi: p.phi }));
  const locks: Record<string, { value: boolean; text: string }> = {};
  for (const r of ROLE_KEYS) for (const p of PERMISSION_CATALOG) {
    const l = cellLock(r, p.key);
    if (l) locks[`${r}:${p.key}`] = { value: l.value, text: LOCK_TEXT[l.reason][locale] };
  }

  return <PermissionsClient roles={[...ROLE_KEYS]} perms={perms} initial={matrix} locks={locks} locale={locale} loadError={loadError} noPresidentOrVp={officersAssigned === 0} />;
}
