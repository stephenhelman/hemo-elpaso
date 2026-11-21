import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { matchPatientsForEvent } from "@/lib/invitations/match";
import { invitationNamesCondition, CONDITION_WARNING } from "@/lib/invitations/condition-terms";
import { getLocaleCookie } from "@/lib/locale";
import InvitationsManager, { type InvRow, type CallRow } from "@/components/admin/invitations/InvitationsManager";

export default async function EventInvitationsPage({ params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageEvents")) redirect("/admin/dashboard");
  const canPHI = admin.can("canViewPHI");

  const event = await prisma.event.findUnique({ where: { id: params.id }, include: { targeting: true } });
  if (!event) notFound();

  const invitations = await prisma.invitation.findMany({
    where: { eventId: event.id },
    include: { patient: { include: { contactProfile: true } } },
    orderBy: { createdAt: "asc" },
  });
  const warnLocale = (await getLocaleCookie()) === "es" ? "es" : "en";
  const namesCondition = invitationNamesCondition(event);
  const match = await matchPatientsForEvent(event.id);

  const rows: InvRow[] = invitations.map((i) => ({
    id: i.id,
    name: `${i.patient.contactProfile?.firstName ?? ""} ${i.patient.contactProfile?.lastName ?? ""}`.trim() || "—",
    language: i.patient.preferredLanguage === "es" ? "es" : "en",
    familySize: i.patient.familySize,
    // PHI: only shipped to the browser for users who may see it
    diagnoses: canPHI ? i.patient.statedDiagnoses : [],
    status: i.status,
    sentAt: i.sentAt?.toISOString() ?? null,
  }));
  const call: CallRow[] = (match?.callList ?? []).map((p) => ({
    id: p.id,
    name: `${p.contactProfile?.firstName ?? ""} ${p.contactProfile?.lastName ?? ""}`.trim() || "—",
    phone: p.contactProfile?.phone ?? "",
    language: p.preferredLanguage === "es" ? "es" : "en",
    familySize: p.familySize,
    diagnoses: canPHI ? p.statedDiagnoses : [],
    confirmFor: match?.confirmFor.get(p.id) ?? [],
  }));

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <Link href="/admin/events" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>
      <h1 className="text-3xl font-display font-bold text-neutral-900 mb-1">Invitations</h1>
      <p className="text-neutral-600 mb-6">{event.titleEn}</p>
      {event.status !== "published" && (
        <p className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          This event isn&apos;t published. Invitations are generated automatically when it is published.
        </p>
      )}
      {namesCondition && (
        <p role="alert" className="mb-4 rounded-lg bg-amber-50 border border-amber-300 p-3 text-sm text-amber-900">
          <strong>⚠ </strong>{CONDITION_WARNING[warnLocale]}
        </p>
      )}
      <InvitationsManager eventId={event.id} rows={rows} callList={call} canViewPHI={canPHI} warning={namesCondition ? CONDITION_WARNING[warnLocale] : null} />
    </div>
  );
}
