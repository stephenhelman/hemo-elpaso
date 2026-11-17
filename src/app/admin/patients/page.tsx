import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminWithPermissions } from "@/lib/permissions";
import { listPatients } from "@/lib/patients/query";
import PatientsTable, { type PatientRow } from "@/components/admin/patients/PatientsTable";
import { getLocaleCookie } from "@/lib/locale";
import { adminPatientsTranslation } from "@/translation/adminPatients";
import type { Lang } from "@/types";

export default async function AdminPatientsPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageUsers")) redirect("/admin/dashboard");

  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  const t = adminPatientsTranslation[locale];
  const canPHI = admin.can("canViewPHI");

  // Filters are applied client-side (no query strings: a diagnosis filter in a
  // URL would put PHI in URLs/logs). Diagnoses are only sent to users who may see them.
  const patients = await listPatients({});
  const rows: PatientRow[] = patients.map((p) => ({
    id: p.id,
    name: `${p.contactProfile?.firstName ?? ""} ${p.contactProfile?.lastName ?? ""}`.trim() || "—",
    phone: p.contactProfile?.phone ?? null,
    email: p.email,
    language: p.preferredLanguage === "es" ? "es" : "en",
    familySize: p.familySize,
    diagnoses: canPHI ? p.statedDiagnoses : [],
    consentData: p.consents.data_and_contact,
    consentMedia: p.consents.media,
    source: p.source,
    createdAt: p.createdAt.toISOString(),
    confirmation: p.confirmation,
    pendingMembers: p.pendingMembers,
    duplicateOfId: p.possibleDuplicateOfId,
    duplicateOfName: p.possibleDuplicateOf
      ? `${p.possibleDuplicateOf.contactProfile?.firstName ?? ""} ${p.possibleDuplicateOf.contactProfile?.lastName ?? ""}`.trim()
      : null,
  }));

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-1">{t.heading}</h1>
          <p className="text-neutral-600">{t.subtitle}</p>
        </div>
        <Link
          href="/admin/patients/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.addPatient}
        </Link>
      </div>
      <PatientsTable rows={rows} canViewPHI={canPHI} locale={locale} />
    </div>
  );
}
