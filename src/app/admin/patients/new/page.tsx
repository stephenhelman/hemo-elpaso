import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminWithPermissions } from "@/lib/permissions";
import PatientForm from "@/components/admin/patients/PatientForm";
import { addressAutocompleteEnabled } from "@/lib/address/server";
import { emptyAddress } from "@/components/form/AddressFields";
import { getLocaleCookie } from "@/lib/locale";
import { adminPatientsTranslation } from "@/translation/adminPatients";
import type { Lang } from "@/types";

export default async function NewPatientPage({ searchParams }: { searchParams: { eventId?: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageUsers")) redirect("/admin/dashboard");
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  const t = adminPatientsTranslation[locale];

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <Link href="/admin/patients" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> {t.back}
      </Link>
      <h1 className="text-3xl font-display font-bold text-neutral-900 mb-1">{t.newTitle}</h1>
      <p className="text-neutral-600 mb-6">{t.newHint}</p>
      <PatientForm
        mode="create"
        returnEventId={searchParams.eventId}
        addressAutocomplete={await addressAutocompleteEnabled()}
        canViewPHI={admin.can("canViewPHI")}
        locale={locale}
        initial={{ firstName: "", lastName: "", email: "", phone: "", address: emptyAddress(), language: "en", familySize: 1, diagnoses: [], members: [], consentData: false, consentMedia: false, attestation: false }}
      />
    </div>
  );
}
