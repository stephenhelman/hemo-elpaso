/**
 * Seed role_permissions from the code defaults (src/lib/permission-catalog.ts). Idempotent: existing cells are left
 * as they are (a board-edited matrix is never overwritten); only missing cells are added. Dev/prod guarded.
 *   npm run db:seed-permissions
 */
import "./_load-env";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_MATRIX } from "../src/lib/permission-catalog";
import { matrixToCells } from "../src/lib/permission-rules";

async function main() {
  const prisma = new PrismaClient();
  try {
    const cells = matrixToCells(DEFAULT_MATRIX);
    const { count } = await prisma.rolePermission.createMany({ data: cells, skipDuplicates: true });
    console.log(`role_permissions: ${count} cell(s) added, ${cells.length - count} already present.`);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
