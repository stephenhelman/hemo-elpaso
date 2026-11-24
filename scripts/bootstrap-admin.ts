/**
 * Create the settings-only organizational admin account (separation of duties: it manages settings, feature
 * toggles, permissions, email routing, board roles and site content, and can NEVER see family records).
 *
 *   npx tsx scripts/bootstrap-admin.ts [email] [firstName] [lastName]
 *   (defaults: admin@<mail domain> "HOEP" "Admin")
 *
 * Creates a Patient (role "admin", auth0Id NULL, lowercased email) with a ContactProfile and NO board role. On the
 * first Auth0 login with the same VERIFIED email (Google Workspace), the session is linked to the row
 * (src/lib/board/link-session.ts). Idempotent. Refuses if that email already belongs to a person with a board role:
 * the admin account can never be an officer. To create an officer instead, use scripts/bootstrap-officer.ts.
 *
 * Also (idempotently) seeds the email template catalogue and the permissions matrix cells.
 * Also add the email to BOARD_ALLOWLIST in the Auth0 Action, or login is denied.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { PrismaClient } from "@prisma/client";
import { seedEmailTemplates } from "../prisma/seeds/email-templates";
import { mailbox } from "../src/lib/site";
import { DEFAULT_MATRIX } from "../src/lib/permission-catalog";
import { matrixToCells } from "../src/lib/permission-rules";

async function main() {
  const [emailArg, firstArg, lastArg] = process.argv.slice(2);
  const email = (emailArg ?? mailbox("admin")).trim().toLowerCase();
  const firstName = firstArg ?? "HOEP";
  const lastName = lastArg ?? "Admin";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Invalid email");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  await seedEmailTemplates();
  try {
    await prisma.rolePermission.createMany({ data: matrixToCells(DEFAULT_MATRIX), skipDuplicates: true });

    const existing = await prisma.patient.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, role: { in: ["admin", "board"] } },
      select: { id: true, role: true, auth0Id: true, boardRoles: { where: { active: true }, select: { role: true } } },
    });
    if (existing?.boardRoles.length) {
      console.error(`${email} holds a board role (${existing.boardRoles.map((r) => r.role).join(", ")}). The admin account can never be an officer. Aborting.`);
      process.exit(1);
    }
    if (existing?.role === "admin") {
      console.log(`Admin ${email} already exists (id ${existing.id}, ${existing.auth0Id ? "linked to Auth0" : "not linked yet"}). Nothing to do.`);
      return;
    }
    if (existing) {
      console.error(`${email} is a board member (role "board"). Use a different email for the admin account. Aborting.`);
      process.exit(1);
    }

    const patient = await prisma.patient.create({
      data: {
        auth0Id: null, email, role: "admin", preferredLanguage: "en", source: "web",
        contactProfile: { create: { firstName, lastName } },
      },
      select: { id: true },
    });
    console.log(`Created settings-only admin ${email} (id ${patient.id}). No board role.`);
    console.log("Next: add the email to BOARD_ALLOWLIST (Auth0 Action), then sign in with Google.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
