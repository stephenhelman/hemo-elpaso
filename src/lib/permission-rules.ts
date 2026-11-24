/**
 * The locked rules of the permissions matrix. PURE. The matrix UI shows locked cells, but the rules are enforced HERE
 * (on save and again on every read), so a tampered request or a hand-edited row can never breach them.
 *
 *  1. admin never holds a data permission (separation of duties).
 *  2. phi permissions (health information, family contact details) belong to President and Vice President only,
 *     because the published Privacy Policy says so. Changing that requires a privacy policy change.
 *  3. canManageSettings, canManageFeatureToggles, canManagePermissions, canManageEmailRouting and
 *     canAssignBoardRoles are admin-only, and admin always holds them (so admin can never lock itself out).
 *  4. At least one of President / Vice President always holds canManageUsers, so the board can't lock itself
 *     out of family records.
 */
import {
  ADMIN_ONLY_PERMISSIONS, DEFAULT_MATRIX, PERMISSION_CATALOG, PERMISSION_KEYS, PHI_ROLES, ROLE_KEYS, permissionDef,
  type Matrix, type Permission, type RoleKey,
} from "./permission-catalog";

export type LockReason = "admin_no_data" | "phi_policy" | "admin_only";
export type Lock = { reason: LockReason; value: boolean };

export const LOCK_TEXT: Record<LockReason, { en: string; es: string }> = {
  phi_policy: { en: "Changing this requires a privacy policy change.", es: "Cambiar esto requiere un cambio en la política de privacidad." },
  admin_no_data: { en: "The admin account can never hold data permissions (separation of duties).", es: "La cuenta de administración nunca puede tener permisos de datos (separación de funciones)." },
  admin_only: { en: "Settings permission: held by the admin account only.", es: "Permiso de configuración: solo lo tiene la cuenta de administración." },
};

/** null = editable. Otherwise the cell is fixed at `value`. */
export function cellLock(role: RoleKey, perm: Permission): Lock | null {
  const def = permissionDef(perm);
  if (role === "ADMIN") {
    if (def.category === "data") return { reason: "admin_no_data", value: false };
    if (ADMIN_ONLY_PERMISSIONS.includes(perm)) return { reason: "admin_only", value: true };
    return null;
  }
  if (ADMIN_ONLY_PERMISSIONS.includes(perm)) return { reason: "admin_only", value: false };
  // phi: only President / VP may hold it (their cells stay editable, subject to rule 4).
  if (def.phi && !PHI_ROLES.includes(role)) return { reason: "phi_policy", value: false };
  return null;
}

export const emptyMatrix = (): Matrix => Object.fromEntries(ROLE_KEYS.map((r) => [r, [] as Permission[]])) as Matrix;

/** Applies every cell lock to a proposed matrix. Unknown keys are dropped. Never throws. */
export function applyLocks(input: Partial<Record<string, readonly string[]>>): Matrix {
  const out = emptyMatrix();
  for (const role of ROLE_KEYS) {
    const wanted = new Set(input[role] ?? []);
    out[role] = PERMISSION_KEYS.filter((p) => {
      const lock = cellLock(role, p);
      return lock ? lock.value : wanted.has(p);
    });
  }
  return out;
}

export const holdsUserManagement = (m: Matrix) => m.PRESIDENT.includes("canManageUsers") || m.VICE_PRESIDENT.includes("canManageUsers");

export type RuleError = "locked_cell" | "no_user_manager";
export type RuleResult = { ok: true; value: Matrix } | { ok: false; error: RuleError; role?: RoleKey; permission?: Permission };

/** Strict validation for a SAVE: a proposal that touches a locked cell is rejected (not silently fixed). */
export function validateMatrix(input: Partial<Record<string, readonly string[]>>): RuleResult {
  for (const role of ROLE_KEYS) {
    const wanted = new Set(input[role] ?? []);
    for (const p of PERMISSION_KEYS) {
      const lock = cellLock(role, p);
      if (lock && wanted.has(p) !== lock.value) return { ok: false, error: "locked_cell", role, permission: p };
    }
  }
  const value = applyLocks(input);
  if (!holdsUserManagement(value)) return { ok: false, error: "no_user_manager", permission: "canManageUsers" };
  return { ok: true, value };
}

export interface StoredCell { role: string; permission: string; granted: boolean }

/**
 * Effective matrix from stored rows: code defaults, overlaid with whatever the table holds, then every lock applied.
 * An empty table gives the defaults. If the stored grid would leave nobody holding canManageUsers among
 * President/VP, canManageUsers falls back to the defaults.
 */
export function resolveMatrix(stored: StoredCell[] | null | undefined): Matrix {
  const base: Record<string, Set<string>> = Object.fromEntries(ROLE_KEYS.map((r) => [r, new Set<string>(DEFAULT_MATRIX[r])]));
  for (const c of stored ?? []) {
    if (!base[c.role] || !(PERMISSION_KEYS as string[]).includes(c.permission)) continue;
    if (c.granted) base[c.role].add(c.permission);
    else base[c.role].delete(c.permission);
  }
  const m = applyLocks(Object.fromEntries(Object.entries(base).map(([r, s]) => [r, Array.from(s)])));
  if (!holdsUserManagement(m)) {
    for (const r of PHI_ROLES) if (DEFAULT_MATRIX[r].includes("canManageUsers")) m[r] = PERMISSION_KEYS.filter((p) => m[r].includes(p) || p === "canManageUsers");
  }
  return m;
}

export function matrixToCells(m: Matrix): StoredCell[] {
  return ROLE_KEYS.flatMap((role) => PERMISSION_KEYS.map((permission) => ({ role, permission, granted: m[role].includes(permission) })));
}

export function diffMatrix(a: Matrix, b: Matrix) {
  const changes: { role: RoleKey; permission: Permission; granted: boolean }[] = [];
  for (const role of ROLE_KEYS) {
    for (const permission of PERMISSION_KEYS) {
      const was = a[role].includes(permission), now = b[role].includes(permission);
      if (was !== now) changes.push({ role, permission, granted: now });
    }
  }
  return changes;
}

export { PERMISSION_CATALOG };
