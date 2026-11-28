/**
 * READ-ONLY: row counts for every table that belongs to a cut feature, plus R2 object counts per prefix.
 * Nothing is written or deleted. Prints counts only, never row contents.
 *
 *   npx tsx scripts/legacy-data-counts.ts            # uses .env.local (dev branch)
 *
 * To run against production, put the production DATABASE_URL and the R2_* values in your shell for ONE command, with
 * R2_ALLOW_PROD_BUCKET=yes (the production bucket is refused otherwise):
 *   R2_ALLOW_PROD_BUCKET=yes DATABASE_URL="…prod…" R2_BUCKET_NAME=… R2_ACCOUNT_ID=… R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=… R2_PUBLIC_URL=… \
 *     npx tsx scripts/legacy-data-counts.ts
 * (this script does not use the db-guard: it only reads).
 */
import "./_load-env";
import { PrismaClient } from "@prisma/client";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { r2Client } from "../src/lib/r2";
import { missingR2Env, r2Config } from "../src/lib/r2-config";

const prisma = new PrismaClient();

const TABLES: [string, () => Promise<number>][] = [
  ["disorder_profiles", () => prisma.disorderProfile.count()],
  ["family_members", () => prisma.familyMember.count()],
  ["families", () => prisma.family.count()],
  ["family_memberships", () => prisma.familyMembership.count()],
  ["board_approvals", () => prisma.boardApproval.count()],
  ["financial_assistance_applications", () => prisma.financialAssistanceApplication.count()],
  ["assistance_documents", () => prisma.assistanceDocument.count()],
  ["assistance_disbursements", () => prisma.assistanceDisbursement.count()],
  ["volunteer_profiles", () => prisma.volunteerProfile.count()],
  ["volunteer_applications", () => prisma.volunteerApplication.count()],
  ["volunteer_event_assignments", () => prisma.volunteerEventAssignment.count()],
  ["volunteer_timecards", () => prisma.volunteerTimecard.count()],
  ["sponsors", () => prisma.sponsor.count()],
  ["sponsor_access_tokens", () => prisma.sponsorAccessToken.count()],
  ["patient_preferences", () => prisma.patientPreferences.count()],
  ["communication_logs", () => prisma.communicationLog.count()],
  ["newsletters", () => prisma.newsletter.count()],
  ["board_minutes", () => prisma.boardMinutes.count()],
  ["annual_reports", () => prisma.annualReport.count()],
  ["tax_filings", () => prisma.taxFiling.count()],
  ["scholarships", () => prisma.scholarship.count()],
  ["polls", () => prisma.poll.count()],
  ["poll_responses", () => prisma.pollResponse.count()],
  ["event_questions", () => prisma.eventQuestion.count()],
  ["event_presentations", () => prisma.eventPresentation.count()],
  ["presenter_access_tokens", () => prisma.presenterAccessToken.count()],
  // Columns on live tables that old code wrote:
  ["board_roles with gmail tokens", () => prisma.boardRole.count({ where: { OR: [{ gmailAccessToken: { not: null } }, { gmailRefreshToken: { not: null } }] } })],
  ["patients with emergencyContactName", () => prisma.patient.count({ where: { emergencyContactName: { not: null } } })],
  ["contact_profiles with dateOfBirth", () => prisma.contactProfile.count({ where: { dateOfBirth: { not: null } } })],
  ["rsvps with dietary/special needs", () => prisma.rsvp.count({ where: { OR: [{ dietaryRestrictions: { not: null } }, { specialNeeds: { not: null } }] } })],
];

async function main() {
  const host = (() => { try { return new URL(process.env.DATABASE_URL ?? "").host; } catch { return "(unset)"; } })();
  console.log(`Database host: ${host}\n`);
  console.log("TABLES (cut features)");
  for (const [name, fn] of TABLES) {
    try { console.log(`  ${String(await fn()).padStart(6)}  ${name}`); }
    catch (e) { console.log(`   error  ${name}: ${(e as Error).message.split("\n")[0]}`); }
  }

  const missing = missingR2Env();
  if (missing.length) { console.log(`\nR2 not configured (missing ${missing.join(", ")}), skipping.`); return; }
  let bucket: string;
  try { bucket = r2Config().bucket; }
  catch (e) { console.log(`\nR2 not used: ${(e as Error).message}`); return; }
  // Count objects by their first path segment (and second, for photos/uploads).
  const counts = new Map<string, number>();
  let token: string | undefined;
  do {
    const r = await r2Client().send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
    for (const o of r.Contents ?? []) {
      const parts = (o.Key ?? "").split("/");
      const prefix = parts.length > 1 ? `${parts[0]}/` : "(root)";
      counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  console.log(`\nR2 bucket ${bucket}: objects per top-level prefix`);
  Array.from(counts.entries()).sort().forEach(([p, n]) => console.log(`  ${String(n).padStart(6)}  ${p}`));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
