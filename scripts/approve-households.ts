/**
 * Approves the households you name, by primary email. DRY RUN unless you pass --apply.
 *   npx tsx scripts/approve-households.ts --env .env.production.local you@example.org other@example.org
 *   npx tsx scripts/approve-households.ts --env .env.production.local --apply you@example.org other@example.org
 * Matches the household's primary email (case-insensitive); an email that matches no household, or more than one, is
 * reported and skipped. Each approval is one audit row (actor type "system", ids + status only: no emails).
 * Run it right after the review-queue migration so known families aren't left pending. Emails are command-line
 * arguments on purpose: nothing personal is stored in the repository.
 */
import { existsSync, readFileSync } from "node:fs";
import { config, parse } from "dotenv";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const envIdx = args.indexOf("--env");
if (envIdx >= 0) {
  const file = args[envIdx + 1];
  if (!file || !existsSync(file)) { console.error(`env file not found: ${file}`); process.exit(1); }
  Object.assign(process.env, parse(readFileSync(file)));
} else {
  config({ path: ".env.local" });
  config();
}
const emails = args.filter((a, i) => !a.startsWith("--") && !(envIdx >= 0 && i === envIdx + 1)).map((e) => e.trim().toLowerCase()).filter(Boolean);

async function main() {
  if (emails.length === 0) { console.error("Give at least one household email."); process.exit(1); }
  const { prisma } = await import("@/lib/db");
  const { audit } = await import("@/lib/audit");
  const { AuditAction } = await import("@prisma/client");
  const { PATIENT_ONLY } = await import("@/lib/patients/query");
  let host = "(unset)";
  try { host = new URL(process.env.DATABASE_URL ?? "").host; } catch { /* keep */ }
  console.log(`Database host: ${host}\n${apply ? "APPLYING" : "DRY RUN (add --apply to write)"}\n`);

  let changed = 0;
  for (const email of emails) {
    const found = await prisma.patient.findMany({ where: { ...PATIENT_ONLY, email: { equals: email, mode: "insensitive" } }, select: { id: true, reviewStatus: true } });
    if (found.length === 0) { console.log(`SKIP  no household with that email: ${email}`); continue; }
    if (found.length > 1) { console.log(`SKIP  ${found.length} households share that email: ${email} (approve them in /admin/review)`); continue; }
    const h = found[0];
    if (h.reviewStatus === "approved") { console.log(`OK    already approved: ${h.id}`); continue; }
    console.log(`${apply ? "APPROVE" : "WOULD APPROVE"} ${h.id} (${h.reviewStatus} -> approved)`);
    if (!apply) continue;
    await prisma.patient.update({ where: { id: h.id }, data: { reviewStatus: "approved", reviewHoldReason: null, reviewedAt: new Date(), reviewedByPatientId: null } });
    await audit({
      actorType: "system", action: AuditAction.REVIEW_STATUS_CHANGED, resourceType: "Patient", resourceId: h.id,
      details: `Review status ${h.reviewStatus} -> approved (post-migration script)`, changes: { householdId: h.id, from: h.reviewStatus, status: "approved", reasonCode: null },
    });
    changed++;
  }
  console.log(`\n${apply ? `${changed} household(s) approved.` : "Nothing written."}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
