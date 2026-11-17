import { NextRequest, NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import { listPatients } from "@/lib/patients/query";
import { auditPatient } from "@/lib/patients/audit";

// Neutralize spreadsheet formula injection and quote
function cell(v: unknown) {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * CSV export. Diagnoses are included ONLY for users with the admin role
 * (isSuperAdmin); everyone else gets the same file without that column.
 * The audit entry records counts and whether diagnoses were included, never the
 * filter values (a diagnosis filter would itself reveal PHI).
 */
export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;

  // Filters arrive in the POST body, never the URL: a diagnosis filter in a
  // query string would put PHI in URLs/logs.
  const f = await req.json().catch(() => ({}));
  const patients = await listPatients({
    q: typeof f.q === "string" ? f.q : undefined,
    diagnosis: admin!.can("canViewPHI") && typeof f.diagnosis === "string" ? f.diagnosis : undefined,
    language: typeof f.language === "string" ? f.language : undefined,
    consent: typeof f.consent === "string" ? f.consent : undefined,
    duplicates: f.duplicates === true,
    pendingConfirmations: f.pendingConfirmations === true,
  });

  const withDx = admin!.isSuperAdmin;
  const header = [
    "ID", "First Name", "Last Name", "Email", "Phone", "Address", "Language",
    "Family Size", "Source", "Data & Contact Consent", "Media Consent",
    "Possible Duplicate", "Created",
    ...(withDx ? ["Stated Diagnoses"] : []),
  ];
  const yn = (v: boolean | null) => (v === null ? "none" : v ? "yes" : "no");
  const rows = patients.map((p) => [
    p.id,
    p.contactProfile?.firstName, p.contactProfile?.lastName,
    p.email, p.contactProfile?.phone, p.contactProfile?.addressLine1,
    p.preferredLanguage, p.familySize, p.source,
    yn(p.consents.data_and_contact), yn(p.consents.media),
    p.possibleDuplicateOfId ? "yes" : "no",
    p.createdAt.toISOString(),
    ...(withDx ? [p.statedDiagnoses.join("; ")] : []),
  ]);
  const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");

  await auditPatient(
    admin!.id,
    AuditAction.USERS_EXPORTED,
    null,
    `Exported ${patients.length} patients to CSV (diagnoses ${withDx ? "included" : "excluded"})`,
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="patients-${new Date().toISOString().split("T")[0]}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
