import { SITE_TIMEZONE } from "@/lib/site";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuditAction } from "@prisma/client";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PATIENT_ONLY, currentConsents } from "@/lib/patients/query";
import { auditPatient } from "@/lib/patients/audit";
import PatientForm from "@/components/admin/patients/PatientForm";
import HouseholdPanel from "@/components/admin/patients/HouseholdPanel";
import CancelRsvpButton from "@/components/admin/patients/CancelRsvpButton";
import { eventHasEnded } from "@/lib/rsvp/window";
import DeletePatientPanel from "@/components/admin/patients/DeletePatientPanel";
import NotDuplicateButton from "@/components/admin/patients/NotDuplicateButton";
import ResendConfirmationButton from "@/components/admin/patients/ResendConfirmationButton";
import { confirmationStatus } from "@/lib/patients/query";
import { getLocaleCookie } from "@/lib/locale";
import { adminPatientsTranslation } from "@/translation/adminPatients";
import type { Lang } from "@/types";

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageUsers")) redirect("/admin/dashboard");
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  const t = adminPatientsTranslation[locale];
  const canPHI = admin.can("canViewPHI");

  const p = await prisma.patient.findFirst({
    where: { id: params.id, ...PATIENT_ONLY },
    include: {
      contactProfile: true,
      consentRecords: { orderBy: { createdAt: "desc" } },
      householdMembers: { orderBy: { createdAt: "asc" } },
      rsvps: { include: { event: { select: { titleEn: true, titleEs: true, eventDate: true, endDate: true } } }, orderBy: { rsvpDate: "desc" } },
      checkIns: { select: { id: true, checkInTime: true, event: { select: { titleEn: true, titleEs: true } } }, orderBy: { checkInTime: "desc" } },
      possibleDuplicateOf: { include: { contactProfile: true } },
      possibleDuplicates: { include: { contactProfile: true } },
      emailLogs: { where: { templateType: "REGISTRATION_INFO_CONFIRMATION" }, orderBy: { sentAt: "desc" }, take: 1, select: { status: true } },
    },
  });
  if (!p) notFound();

  // Every detail view is audit-logged (ids only).
  await auditPatient(admin.id, AuditAction.PATIENT_VIEWED, p.id, "Patient detail viewed");

  const cur = currentConsents(p.consentRecords);
  const nm = (x?: { contactProfile: { firstName: string; lastName: string } | null } | null) =>
    x?.contactProfile ? `${x.contactProfile.firstName} ${x.contactProfile.lastName}` : "—";

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-6">
      <Link href="/admin/patients" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900">
        <ArrowLeft className="w-4 h-4" /> {t.back}
      </Link>
      <div>
        <h1 className="text-3xl font-display font-bold text-neutral-900">{nm(p)}</h1>
        <p className="text-xs text-neutral-400 mt-1">
          {t.detailsViewed} · {p.source} · {p.createdAt.toLocaleDateString("en-US", { timeZone: SITE_TIMEZONE })}
        </p>
      </div>

      {(() => {
        const c = confirmationStatus(p);
        return c === "failed" || c === "missing" ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            {t.confirmationNotSent}.{" "}
            <ResendConfirmationButton patientId={p.id} label={t.resendConfirmation} />
          </div>
        ) : null;
      })()}

      {(p.possibleDuplicateOf || p.possibleDuplicates.length > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-1">
          {p.possibleDuplicateOf && (
            <p>
              {t.duplicateOf}{" "}
              <Link className="font-semibold underline" href={`/admin/patients/${p.possibleDuplicateOf.id}`}>
                {nm(p.possibleDuplicateOf)}
              </Link>{" "}
              <NotDuplicateButton patientId={p.id} label={t.notDuplicate} />
            </p>
          )}
          {p.possibleDuplicates.length > 0 && (
            <p>
              {t.duplicatesOfThis}:{" "}
              {p.possibleDuplicates.map((d) => (
                <Link key={d.id} className="font-semibold underline mr-2" href={`/admin/patients/${d.id}`}>
                  {nm(d)}
                </Link>
              ))}
            </p>
          )}
        </div>
      )}

      <PatientForm
        mode="edit"
        patientId={p.id}
        canViewPHI={canPHI}
        locale={locale}
        initial={{
          firstName: p.contactProfile?.firstName ?? "",
          lastName: p.contactProfile?.lastName ?? "",
          email: p.email ?? "",
          phone: p.contactProfile?.phone ?? "",
          address: p.contactProfile?.addressLine1 ?? "",
          language: p.preferredLanguage === "es" ? "es" : "en",
          familySize: p.familySize,
          diagnoses: canPHI ? p.primaryDiagnoses : [],
          members: [],
          consentData: cur.data_and_contact === true,
          consentMedia: cur.media === true,
          attestation: false,
        }}
      />

      <HouseholdPanel
        patientId={p.id}
        locale={locale}
        canViewPHI={canPHI}
        members={p.householdMembers.map((m) => ({
          id: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          relationship: m.relationship,
          ageGroup: m.ageGroup,
          status: m.status,
          confirmByPhone: m.confirmByPhone,
          hasEmail: !!m.email,
          diagnoses: canPHI ? m.statedDiagnoses : [], // PHI: server-side gate
        }))}
      />

      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="font-semibold text-neutral-900 mb-3">{t.consentHistory}</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="py-2">{t.when}</th><th>{t.type}</th><th>{t.granted}</th><th>{t.method}</th><th>{t.version}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {p.consentRecords.map((c) => (
              <tr key={c.id}>
                <td className="py-2">{c.createdAt.toLocaleString("en-US", { timeZone: SITE_TIMEZONE })}</td>
                <td>{c.type}</td>
                <td>{c.granted ? "yes" : "no"}</td>
                <td>{c.method}</td>
                <td>{c.textVersion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="font-semibold text-neutral-900 mb-3">{t.activity}</h2>
        <p className="text-sm text-neutral-700 mb-2">{t.rsvps}: {p.rsvps.length} · {t.checkIns}: {p.checkIns.length}</p>
        <ul className="text-sm text-neutral-600 space-y-1">
          {p.rsvps.map((r) => (
            <li key={r.id}>
              {locale === "es" ? r.event.titleEs : r.event.titleEn} — {r.event.eventDate.toLocaleDateString("en-US", { timeZone: SITE_TIMEZONE })} ({r.attendeeCount})
              {r.cancelledAt ? <span className="ml-2 text-xs text-neutral-400">{locale === "es" ? "cancelada" : "cancelled"}</span> : !eventHasEnded(r.event) && <CancelRsvpButton patientId={p.id} rsvpId={r.id} locale={locale} />}
            </li>
          ))}
        </ul>
      </div>

      <DeletePatientPanel patientId={p.id} locale={locale} />
    </div>
  );
}
