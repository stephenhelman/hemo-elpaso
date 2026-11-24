/**
 * Create the first officer (what bootstrap-admin used to do): a board member with an officer role and real data
 * access, signing in through their own account.
 *
 *   npx tsx scripts/bootstrap-officer.ts <email> <firstName> <lastName> [ROLE]     (ROLE default VICE_PRESIDENT)
 *
 * Creates a Patient (role "board", auth0Id NULL) with a ContactProfile and an active BoardRole. Linked on first
 * Auth0 login by verified email. Idempotent. Refuses the organizational admin mailbox and any "admin" account.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { BoardRoleType, PrismaClient } from "@prisma/client";
import { seedEmailTemplates } from "../prisma/seeds/email-templates";
import { mailbox } from "../src/lib/site";
import { DEFAULT_MATRIX } from "../src/lib/permission-catalog";
import { matrixToCells } from "../src/lib/permission-rules";

async function main() {
  const [emailArg, firstName, lastName, roleArg] = process.argv.slice(2);
  const role = (roleArg ?? "VICE_PRESIDENT") as BoardRoleType;
  if (!emailArg || !firstName || !lastName || !Object.values(BoardRoleType).includes(role)) {
    console.error("Usage: npx tsx scripts/bootstrap-officer.ts <email> <firstName> <lastName> [ROLE]");
    process.exit(1);
  }
  const email = emailArg.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { console.error("Invalid email"); process.exit(1); }
  if (email === mailbox("admin").toLowerCase()) { console.error("The organizational admin account can never be an officer."); process.exit(1); }

  const prisma = new PrismaClient();
  await seedEmailTemplates();
  try {
    await prisma.rolePermission.createMany({ data: matrixToCells(DEFAULT_MATRIX), skipDuplicates: true });
    const existing = await prisma.patient.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, role: { in: ["admin", "board"] } },
      select: { id: true, role: true },
    });
    if (existing?.role === "admin") { console.error(`${email} is a settings-only admin account; it can never hold a board role. Aborting.`); process.exit(1); }
    if (existing) { console.log(`Officer ${email} already exists (id ${existing.id}). Nothing to do.`); return; }

    const patient = await prisma.patient.create({
      data: {
        auth0Id: null, email, role: "board", preferredLanguage: "en", source: "web",
        contactProfile: { create: { firstName, lastName } },
        boardRoles: { create: { role, assignedBy: "bootstrap-officer" } },
      },
      select: { id: true },
    });
    console.log(`Created officer ${email} (id ${patient.id}) as ${role}.`);
    console.log("Next: add the email to BOARD_ALLOWLIST (Auth0 Action), then log in.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
