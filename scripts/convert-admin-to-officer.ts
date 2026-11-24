/**
 * One-time conversion for the settings-only admin rule: any Patient with role "admin" who ALSO holds an active board
 * role becomes role "board" (they keep their board roles and data permissions through their own account). Pure
 * "admin" accounts with no board role are left alone. Dry-run unless --apply. Run after db:migrate, before the
 * new code serves traffic.
 *   npx tsx scripts/db-guard.ts && npx tsx scripts/convert-admin-to-officer.ts [--apply]
 */
import "./_load-env";
import { PrismaClient } from "@prisma/client";

async function main() {
  const apply = process.argv.includes("--apply");
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.patient.findMany({
      where: { role: "admin", boardRoles: { some: { active: true } } },
      select: { id: true, boardRoles: { where: { active: true }, select: { role: true } } },
    });
    for (const r of rows) console.log(`${apply ? "Converting" : "Would convert"} ${r.id} (admin -> board), roles: ${r.boardRoles.map((b) => b.role).join(", ")}`);
    if (apply && rows.length) {
      const { count } = await prisma.patient.updateMany({ where: { id: { in: rows.map((r) => r.id) } }, data: { role: "board" } });
      console.log(`${count} account(s) converted.`);
    }
    if (!rows.length) console.log("Nothing to convert.");
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
