/**
 * READ-ONLY. Lists every household with its review status, so you can decide which ones to approve.
 *   npx tsx scripts/list-households-for-review.ts                          (dev database, .env.local)
 *   npx tsx scripts/list-households-for-review.ts --env .env.production.local   (the file you use for npm run db:deploy)
 * Prints names, emails and phones to YOUR terminal (you need them to recognise families). No diagnoses: only a yes/no for
 * "no affected member stated". Nothing is written, nothing is logged.
 */
import { existsSync, readFileSync } from "node:fs";
import { config, parse } from "dotenv";

const i = process.argv.indexOf("--env");
if (i > 0) {
  const file = process.argv[i + 1];
  if (!file || !existsSync(file)) { console.error(`env file not found: ${file}`); process.exit(1); }
  Object.assign(process.env, parse(readFileSync(file)));
} else {
  config({ path: ".env.local" });
  config();
}

async function main() {
  const { prisma } = await import("@/lib/db");
  const { PATIENT_ONLY } = await import("@/lib/patients/query");
  let host = "(unset)";
  try { host = new URL(process.env.DATABASE_URL ?? "").host; } catch { /* keep */ }
  console.log(`Database host: ${host}\n`);
  const rows = await prisma.patient.findMany({
    where: PATIENT_ONLY, orderBy: { createdAt: "asc" },
    select: {
      id: true, email: true, createdAt: true, source: true, reviewStatus: true, reviewHoldReason: true, statedDiagnoses: true,
      contactProfile: { select: { firstName: true, lastName: true, phone: true } },
      householdMembers: { where: { status: "pending" }, select: { id: true } },
      rsvps: { where: { cancelledAt: null }, select: { id: true } },
    },
  });
  console.log(`${rows.length} households\n`);
  console.log(["id", "created", "source", "status", "name", "email", "phone", "noAffected", "adultsPending", "activeRsvps"].join("\t"));
  for (const r of rows) {
    console.log([
      r.id, r.createdAt.toISOString().slice(0, 10), r.source, r.reviewStatus + (r.reviewHoldReason ? `:${r.reviewHoldReason}` : ""),
      `${r.contactProfile?.firstName ?? ""} ${r.contactProfile?.lastName ?? ""}`.trim() || "-", r.email ?? "-", r.contactProfile?.phone ?? "-",
      r.statedDiagnoses.length === 0 ? "yes" : "no", r.householdMembers.length, r.rsvps.length,
    ].join("\t"));
  }
  const by = rows.reduce<Record<string, number>>((m, r) => ((m[r.reviewStatus] = (m[r.reviewStatus] ?? 0) + 1), m), {});
  console.log(`\nBy status: ${JSON.stringify(by)}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
