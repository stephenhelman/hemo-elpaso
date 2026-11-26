/**
 * Where phone routing lives: ONE JSON row in app_settings (key "phone.routing"), so it needs no table of its own.
 * Changes run under a row lock and write their audit entry in the same transaction. Reads are not cached: a call must
 * see the current duty list.
 */
import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auditData, type ActorType } from "@/lib/audit";
import { mailbox } from "@/lib/site";
import { emptyRouting, parseRouting, type Routing } from "./definitions";
import type { Applied, Change } from "./change";

export const ROUTING_KEY = "phone.routing";
type Db = Prisma.TransactionClient | typeof prisma;

/** Missing row = nothing configured. Throws if the database can't be read (the call then uses the fallback number). */
export async function readRouting(db: Db = prisma): Promise<Routing> {
  const row = await db.appSetting.findUnique({ where: { key: ROUTING_KEY }, select: { value: true } });
  return parseRouting(row?.value);
}

export interface BoardPerson { id: string; name: string }

/** People who may be on duty: an active board role. The settings-only admin account never is. */
export async function boardPeople(db: Db = prisma): Promise<BoardPerson[]> {
  const rows = await db.patient.findMany({
    where: { role: { not: "admin" }, mergedIntoId: null, boardRoles: { some: { active: true } } },
    select: { id: true, email: true, contactProfile: { select: { firstName: true, lastName: true } } },
  });
  return rows
    .filter((p) => p.email?.toLowerCase() !== mailbox("admin").toLowerCase())
    .map((p) => ({ id: p.id, name: `${p.contactProfile?.firstName ?? ""} ${p.contactProfile?.lastName ?? ""}`.trim() || p.email || "—" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Apply one change: lock the row, run the pure function on what is there now, save and audit together. */
export async function mutateRouting(
  actor: { type: ActorType; id: string | null },
  apply: (routing: Routing, boardIds: ReadonlySet<string>) => Change,
): Promise<(Applied & { people: BoardPerson[] }) | Extract<Change, { ok: false }>> {
  return prisma.$transaction(async (tx) => {
    await tx.appSetting.createMany({ data: [{ key: ROUTING_KEY, value: emptyRouting() as unknown as Prisma.InputJsonValue }], skipDuplicates: true });
    await tx.$queryRaw`SELECT "key" FROM app_settings WHERE "key" = ${ROUTING_KEY} FOR UPDATE`;
    const people = await boardPeople(tx);
    const result = apply(await readRouting(tx), new Set(people.map((p) => p.id)));
    if (!result.ok) return result;
    await tx.appSetting.update({ where: { key: ROUTING_KEY }, data: { value: result.routing as unknown as Prisma.InputJsonValue, updatedBy: actor.id } });
    await tx.auditLog.create({
      data: auditData({
        actorType: actor.type, actorPatientId: actor.id, action: AuditAction[result.audit.action], resourceType: "PhoneRouting",
        resourceId: result.audit.resourceId, details: "Phone routing", changes: result.audit.changes,
      }),
    });
    return { ...result, people };
  }, { timeout: 15_000 });
}

/** A household merge folded one person into another: their duty numbers follow (lib/identity/merge.ts). */
export async function repointDutyOwner(tx: Prisma.TransactionClient, fromId: string, toId: string): Promise<number> {
  const row = await tx.appSetting.findUnique({ where: { key: ROUTING_KEY }, select: { value: true } });
  if (!row) return 0;
  await tx.$queryRaw`SELECT "key" FROM app_settings WHERE "key" = ${ROUTING_KEY} FOR UPDATE`;
  const routing = await readRouting(tx);
  const mine = routing.numbers.filter((n) => n.ownerId === fromId);
  if (mine.length === 0) return 0;
  for (const n of mine) n.ownerId = toId;
  await tx.appSetting.update({ where: { key: ROUTING_KEY }, data: { value: routing as unknown as Prisma.InputJsonValue } });
  return mine.length;
}
