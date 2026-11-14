/**
 * Create the first admin (no one can invite board members until one exists).
 *
 *   npx tsx scripts/bootstrap-admin.ts <email> <firstName> <lastName>
 *
 * Creates a Patient (role "admin", auth0Id NULL, lowercased email) with a
 * ContactProfile and an active VICE_PRESIDENT BoardRole. On that person's first
 * Auth0 login with the same VERIFIED email, the session is linked to the row
 * (src/lib/board/link-session.ts). Idempotent: if an admin with that email
 * already exists, it does nothing.
 *
 * Also (idempotently) seeds the email template catalogue, so a fresh/wiped DB is
 * never left without it.
 *
 * Also add the email to BOARD_ALLOWLIST in the Auth0 Action, or login is denied.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { PrismaClient } from "@prisma/client";
import { seedEmailTemplates } from "../prisma/seeds/email-templates";

async function main() {
  const [emailArg, firstName, lastName] = process.argv.slice(2);
  if (!emailArg || !firstName || !lastName) {
    console.error(
      "Usage: npx tsx scripts/bootstrap-admin.ts <email> <firstName> <lastName>",
    );
    process.exit(1);
  }
  const email = emailArg.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Invalid email");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  await seedEmailTemplates();
  try {
    const existing = await prisma.patient.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, role: "admin" },
      select: { id: true, auth0Id: true },
    });
    if (existing) {
      console.log(
        `Admin ${email} already exists (id ${existing.id}, ${existing.auth0Id ? "linked to Auth0" : "not linked yet"}). Nothing to do.`,
      );
      return;
    }

    const patient = await prisma.patient.create({
      data: {
        auth0Id: null,
        email,
        role: "admin",
        preferredLanguage: "en",
        source: "web",
        contactProfile: { create: { firstName, lastName } },
        boardRoles: {
          create: { role: "VICE_PRESIDENT", assignedBy: "bootstrap-admin" },
        },
      },
      select: { id: true },
    });
    console.log(`Created admin ${email} (id ${patient.id}) as VICE_PRESIDENT.`);
    console.log("Next: add the email to BOARD_ALLOWLIST (Auth0 Action), then log in.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
