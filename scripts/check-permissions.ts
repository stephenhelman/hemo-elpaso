/**
 * Run: npm run check:permissions (pure, no DB).
 * Asserts the locked rules of the permissions matrix:
 *  - health-information (phi) permissions belong to PRESIDENT and VICE_PRESIDENT only (published Privacy Policy);
 *  - the settings-only admin never holds a data permission, and always holds the admin-only settings permissions;
 *  - at least one of President / VP always holds canManageUsers;
 *  - a stored or hand-edited matrix can never breach any of these; the code defaults are the fallback.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  ADMIN_ONLY_PERMISSIONS, DEFAULT_MATRIX, PERMISSION_CATALOG, PERMISSION_KEYS, ROLE_KEYS, ROLE_PERMISSIONS, type Matrix, type Permission,
} from "../src/lib/permission-catalog";
import { applyLocks, cellLock, resolveMatrix, validateMatrix, matrixToCells } from "../src/lib/permission-rules";
import { changeMatrix } from "../src/lib/permission-matrix/change";
import { resolvePermissions } from "../src/lib/permissions";

const holders = (m: Matrix, p: Permission) => ROLE_KEYS.filter((r) => m[r].includes(p)).sort();
const phi: Permission[] = PERMISSION_CATALOG.filter((p) => p.phi).map((p) => p.key);
const data: Permission[] = PERMISSION_CATALOG.filter((p) => p.category === "data").map((p) => p.key);
const clone = (m: Matrix): Matrix => JSON.parse(JSON.stringify(m));

test("canViewPHI and canReviewVerification: PRESIDENT and VICE_PRESIDENT only", () => {
  assert.deepEqual(holders(DEFAULT_MATRIX, "canViewPHI"), ["PRESIDENT", "VICE_PRESIDENT"]);
  assert.deepEqual(holders(DEFAULT_MATRIX, "canReviewVerification"), ["PRESIDENT", "VICE_PRESIDENT"]);
});

test("every phi permission is held only by PRESIDENT / VICE_PRESIDENT in the defaults", () => {
  for (const p of phi) for (const h of holders(DEFAULT_MATRIX, p)) assert.ok(["PRESIDENT", "VICE_PRESIDENT"].includes(h), `${p}: ${h}`);
  for (const p of ["canViewPHI", "canReviewVerification", "canManageUsers", "canManageEvents", "canApproveAssistance", "canViewAuditLogs"] as Permission[]) {
    assert.ok(phi.includes(p), `${p} is flagged phi`);
  }
});

test("admin holds no data permission, and exactly the settings ones", () => {
  for (const p of data) assert.equal(DEFAULT_MATRIX.ADMIN.includes(p), false, p);
  for (const p of ADMIN_ONLY_PERMISSIONS) assert.ok(DEFAULT_MATRIX.ADMIN.includes(p), p);
  assert.ok(DEFAULT_MATRIX.ADMIN.includes("canEditSiteContent"));
});

test("officers lost the admin-only settings permissions but keep canEditSiteContent", () => {
  for (const r of ["PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER"] as const) {
    for (const p of ADMIN_ONLY_PERMISSIONS) assert.equal(ROLE_PERMISSIONS[r].includes(p), false, `${r} ${p}`);
    assert.ok(ROLE_PERMISSIONS[r].includes("canEditSiteContent"), r);
  }
  assert.equal(ROLE_PERMISSIONS.TREASURER.includes("canViewAuditLogs"), false);
});

test("the defaults satisfy every lock", () => {
  assert.deepEqual(validateMatrix(DEFAULT_MATRIX), { ok: true, value: DEFAULT_MATRIX });
});

test("a save that grants a phi permission to another role is rejected", () => {
  const m = clone(DEFAULT_MATRIX);
  m.SECRETARY.push("canViewPHI");
  const v = validateMatrix(m);
  assert.equal(v.ok, false);
  assert.equal(!v.ok && v.error, "locked_cell");
  assert.ok(cellLock("TREASURER", "canViewPHI"));
});

test("a save that gives admin a data permission, or takes a settings permission away, is rejected", () => {
  const a = clone(DEFAULT_MATRIX); a.ADMIN.push("canViewEventStats");
  assert.equal(validateMatrix(a).ok, false);
  const b = clone(DEFAULT_MATRIX); b.ADMIN = b.ADMIN.filter((p) => p !== "canManagePermissions");
  assert.equal(validateMatrix(b).ok, false);
});

test("a save that leaves no President/VP holding canManageUsers is rejected", () => {
  const m = clone(DEFAULT_MATRIX);
  m.PRESIDENT = m.PRESIDENT.filter((p) => p !== "canManageUsers");
  m.VICE_PRESIDENT = m.VICE_PRESIDENT.filter((p) => p !== "canManageUsers");
  const v = validateMatrix(m);
  assert.equal(!v.ok && v.error, "no_user_manager");
  // one of them is enough
  m.VICE_PRESIDENT.push("canManageUsers");
  assert.equal(validateMatrix(m).ok, true);
});

test("a tampered stored table can never breach a lock (resolveMatrix re-applies them)", () => {
  const cells = [
    { role: "ADMIN", permission: "canViewPHI", granted: true },
    { role: "ADMIN", permission: "canManageUsers", granted: true },
    { role: "SECRETARY", permission: "canViewPHI", granted: true },
    { role: "SECRETARY", permission: "canManageSettings", granted: true },
    { role: "ADMIN", permission: "canManagePermissions", granted: false },
    { role: "NOBODY", permission: "canViewPHI", granted: true },
    { role: "SECRETARY", permission: "canDoAnything", granted: true },
  ];
  const m = resolveMatrix(cells);
  assert.equal(m.ADMIN.includes("canViewPHI"), false);
  assert.equal(m.ADMIN.includes("canManageUsers"), false);
  assert.equal(m.SECRETARY.includes("canViewPHI"), false);
  assert.equal(m.SECRETARY.includes("canManageSettings"), false);
  assert.ok(m.ADMIN.includes("canManagePermissions"));
});

test("stored grid that removes canManageUsers from President and VP falls back for that permission", () => {
  const m = resolveMatrix([
    { role: "PRESIDENT", permission: "canManageUsers", granted: false },
    { role: "VICE_PRESIDENT", permission: "canManageUsers", granted: false },
  ]);
  assert.ok(m.PRESIDENT.includes("canManageUsers") || m.VICE_PRESIDENT.includes("canManageUsers"));
});

test("empty or missing table gives the code defaults; the full grid round-trips", () => {
  assert.deepEqual(resolveMatrix([]), DEFAULT_MATRIX);
  assert.deepEqual(resolveMatrix(null), DEFAULT_MATRIX);
  assert.deepEqual(resolveMatrix(matrixToCells(DEFAULT_MATRIX)), DEFAULT_MATRIX);
  assert.equal(matrixToCells(DEFAULT_MATRIX).length, ROLE_KEYS.length * PERMISSION_KEYS.length);
});

test("admin account resolves to settings permissions only, even if it somehow holds a board role", () => {
  const perms = resolvePermissions("admin", ["PRESIDENT"], DEFAULT_MATRIX);
  for (const p of data) assert.equal(perms.has(p), false, p);
  assert.ok(perms.has("canManagePermissions"));
  const officer = resolvePermissions("board", ["VICE_PRESIDENT"], DEFAULT_MATRIX);
  assert.ok(officer.has("canViewPHI"));
  assert.equal(officer.has("canManagePermissions"), false);
});

test("changeMatrix: persists, audits via persist, invalidates, notifies; rejects locked cells without side effects", async () => {
  const calls: string[] = [];
  const deps = {
    readCurrent: async () => DEFAULT_MATRIX,
    persist: async () => { calls.push("persist"); },
    invalidate: () => { calls.push("invalidate"); },
    notifyOfficers: async () => { calls.push("notify"); return true; },
  };
  const ok = clone(DEFAULT_MATRIX); ok.SECRETARY.push("canViewFinancials");
  const r = await changeMatrix(deps, ok, { id: "a", name: "Admin" });
  assert.equal(r.ok && r.changed, true);
  assert.deepEqual(calls, ["persist", "invalidate", "notify"]);

  calls.length = 0;
  const bad = clone(DEFAULT_MATRIX); bad.SECRETARY.push("canViewPHI");
  assert.equal((await changeMatrix(deps, bad, { id: "a", name: "Admin" })).ok, false);
  assert.equal((await changeMatrix(deps, DEFAULT_MATRIX, { id: "a", name: "Admin" })).ok, true);
  assert.deepEqual(calls, []);
});

test("applyLocks drops unknown roles and permissions", () => {
  const m = applyLocks({ PRESIDENT: ["canViewPHI", "bogus"], GHOST: ["canViewPHI"] });
  assert.deepEqual(m.PRESIDENT, ["canViewPHI"]);
});

test("the permissions API is gated by canManagePermissions first, and the recap route uses requirePermission", () => {
  const src = readFileSync("src/app/api/admin/settings/permissions/route.ts", "utf8");
  for (const h of Array.from(src.matchAll(/export async function (GET|PUT)\(/g))) {
    assert.ok(src.slice(h.index!).indexOf('requirePermission("canManagePermissions")') < 200, h[1]);
  }
  assert.ok(readFileSync("src/app/api/admin/events/[id]/recap/route.ts", "utf8").includes('requirePermission("canManageEvents")'));
});

test("no admin API route is left without requirePermission/requireAnyPermission", async () => {
  const { execSync } = await import("node:child_process");
  const files = execSync("find src/app/api/admin -name route.ts", { encoding: "utf8" }).trim().split("\n");
  for (const f of files) assert.match(readFileSync(f, "utf8"), /requirePermission|requireAnyPermission/, f);
});

test("the board-role assignment code refuses the admin account", () => {
  const src = readFileSync("src/lib/board/assign.ts", "utf8");
  assert.ok(src.includes("admin_cannot_hold_board_role"));
});
