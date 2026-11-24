/**
 * Saving the permissions matrix: validate the locked rules, diff, save + audit, drop the cache, tell the officers.
 * Side effects are injected so the rules are testable without a database (scripts/check-permissions.ts).
 */
import { diffMatrix, validateMatrix, type RuleError } from "../permission-rules";
import type { Matrix, Permission, RoleKey } from "../permission-catalog";

export interface Actor { id: string; name: string }
export interface MatrixChange { role: RoleKey; permission: Permission; granted: boolean }
export interface MatrixChangeRecord { changes: MatrixChange[]; next: Matrix; actor: Actor; details: string }

export interface MatrixDeps {
  readCurrent: () => Promise<Matrix>;
  /** Upsert the changed cells AND write the audit entry in one transaction. */
  persist: (rec: MatrixChangeRecord) => Promise<void>;
  invalidate: () => void;
  notifyOfficers: (rec: MatrixChangeRecord) => Promise<boolean>;
}

export type MatrixResult =
  | { ok: true; changed: false; matrix: Matrix }
  | { ok: true; changed: true; matrix: Matrix; changes: MatrixChange[]; noticeSent: boolean }
  | { ok: false; error: RuleError; role?: RoleKey; permission?: Permission };

export async function changeMatrix(deps: MatrixDeps, input: unknown, actor: Actor): Promise<MatrixResult> {
  if (!input || typeof input !== "object") return { ok: false, error: "locked_cell" };
  const v = validateMatrix(input as Record<string, string[]>);
  if (!v.ok) return v;

  const current = await deps.readCurrent();
  const changes = diffMatrix(current, v.value);
  if (changes.length === 0) return { ok: true, changed: false, matrix: current };

  const summary = changes.map((c) => `${c.granted ? "+" : "-"}${c.permission} (${c.role})`).join(", ");
  const rec: MatrixChangeRecord = { changes, next: v.value, actor, details: `Permissions matrix changed by ${actor.name}: ${summary}` };
  await deps.persist(rec);
  deps.invalidate();
  let noticeSent = false;
  try { noticeSent = await deps.notifyOfficers(rec); } catch { noticeSent = false; }
  return { ok: true, changed: true, matrix: v.value, changes, noticeSent };
}
