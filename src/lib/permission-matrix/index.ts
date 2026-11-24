/**
 * Permissions matrix: runtime read (tag-cached, same pattern as email routing) and the DB-backed save deps.
 * Rules live in ../permission-rules (pure). If the table is empty or the read throws, the code defaults are used and
 * the site keeps working; a failed read is NOT cached (the throw is caught outside the cached function).
 */
import { revalidateTag, unstable_cache } from "next/cache";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEFAULT_MATRIX, type Matrix } from "@/lib/permission-catalog";
import { matrixToCells, resolveMatrix, type StoredCell } from "@/lib/permission-rules";
import { notifyOfficersOfAdminAction } from "@/lib/admin-notice";
import type { MatrixChangeRecord, MatrixDeps } from "./change";

export const PERMISSIONS_TAG = "role-permissions";

const readStoredCached = unstable_cache(
  async (): Promise<StoredCell[]> =>
    (await prisma.rolePermission.findMany({ select: { role: true, permission: true, granted: true } })),
  ["role-permissions-all"],
  { tags: [PERMISSIONS_TAG], revalidate: 86400 },
);

/** The effective matrix. Never throws. */
export async function getMatrix(): Promise<Matrix> {
  try {
    return resolveMatrix(await readStoredCached());
  } catch (e) {
    console.error("permissions matrix read failed, using code defaults", { error: e instanceof Error ? e.name : "unknown" });
    return DEFAULT_MATRIX;
  }
}

/** Uncached read for the editor. */
export async function readMatrixFresh(): Promise<{ matrix: Matrix; seeded: boolean }> {
  const rows = await prisma.rolePermission.findMany({ select: { role: true, permission: true, granted: true } });
  return { matrix: resolveMatrix(rows), seeded: rows.length > 0 };
}

export const invalidateMatrix = () => revalidateTag(PERMISSIONS_TAG);

export async function persistMatrix(rec: MatrixChangeRecord): Promise<void> {
  // Write the FULL grid (not only the diff) so the table is always a complete, self-describing snapshot.
  const cells = matrixToCells(rec.next);
  await prisma.$transaction([
    ...cells.map((c) =>
      prisma.rolePermission.upsert({
        where: { role_permission: { role: c.role, permission: c.permission } },
        create: { ...c, updatedBy: rec.actor.id },
        update: { granted: c.granted, updatedBy: rec.actor.id },
      }),
    ),
    prisma.auditLog.create({
      data: {
        patientId: rec.actor.id,
        action: AuditAction.PERMISSIONS_CHANGED,
        resourceType: "RolePermission",
        details: rec.details,
        changes: { changedBy: rec.actor.name, changes: rec.changes.map((c) => ({ ...c })) },
        actorType: "board",
      },
    }),
  ]);
}

export async function notifyMatrixChange(rec: MatrixChangeRecord): Promise<boolean> {
  const list = rec.changes.map((c) => `${c.granted ? "granted" : "removed"} ${c.permission} ${c.granted ? "to" : "from"} ${c.role}`);
  const listEs = rec.changes.map((c) => `${c.granted ? "se otorgó" : "se quitó"} ${c.permission} ${c.granted ? "a" : "de"} ${c.role}`);
  return notifyOfficersOfAdminAction({
    subjectEn: "Permissions changed", subjectEs: "Cambio en los permisos",
    linesEn: [`The permissions matrix was changed by ${rec.actor.name}:`, ...list],
    linesEs: [`${rec.actor.name} cambió la matriz de permisos:`, ...listEs],
  });
}

export const matrixDeps = (): MatrixDeps => ({
  readCurrent: async () => (await readMatrixFresh()).matrix,
  persist: persistMatrix,
  invalidate: invalidateMatrix,
  notifyOfficers: notifyMatrixChange,
});
