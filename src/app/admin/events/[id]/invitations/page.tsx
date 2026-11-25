import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { eventCallList } from "@/lib/rsvp/call-list";
import { isFeatureEnabled } from "@/lib/features";
import { confirmBlock } from "@/lib/rsvp/request-rules";
import { invitationNamesCondition, CONDITION_WARNING } from "@/lib/invitations/condition-terms";
import { getLocaleCookie } from "@/lib/locale";
import InvitationsManager, { type InvRow } from "@/components/admin/invitations/InvitationsManager";

export default async function EventInvitationsPage({ params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageEvents")) redirect("/admin/dashboard");
  const canPHI = admin.can("canViewPHI");

  const event = await prisma.event.findUnique({ where: { id: params.id }, include: { targeting: true } });
  if (!event) notFound();

  const invitations = await prisma.invitation.findMany({
    where: { eventId: event.id, status: { not: "removed" } },
    include: { patient: { include: { contactProfile: true } } },
    orderBy: { createdAt: "asc" },
  });
  const removedCount = await prisma.invitation.count({ where: { eventId: event.id, status: "removed" } });
  const warnLocale = (await getLocaleCookie()) === "es" ? "es" : "en";
  const namesCondition = invitationNamesCondition(event);
  const [callRows, recordingsOn] = await Promise.all([eventCallList(event.id), isFeatureEnabled("recordings")]);
  const virtualBlock = confirmBlock({ type: "virtual", status: "pending", householdApproved: true, partySize: 1, inPersonTaken: 0, event, recordingsOn });

  const rows: InvRow[] = invitations.map((i) => ({
    id: i.id,
    name: `${i.patient.contactProfile?.firstName ?? ""} ${i.patient.contactProfile?.lastName ?? ""}`.trim() || "—",
    language: i.patient.preferredLanguage === "es" ? "es" : "en",
    familySize: i.patient.familySize,
    // PHI: only shipped to the browser for users who may see it
    diagnoses: canPHI ? i.patient.statedDiagnoses : [],
    status: i.status,
    sentAt: i.sentAt?.toISOString() ?? null,
    origin: i.origin === "request" ? "request" : i.origin === "manual" ? "manual" : "matched",
    attendanceType: i.attendanceType === "virtual" ? "virtual" : "in_person",
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
      {admin.can("canManageUsers") && (
        <p className="mb-4 text-sm">
          <Link href={`/admin/events/${event.id}/requests`} className="font-semibold text-primary hover:underline">RSVP requests</Link>
          {" · "}
          <Link href={`/admin/events/${event.id}/invitations/report`} className="font-semibold text-primary hover:underline">
            Matched / sent / removed report
          </Link>
          {" · "}
          <Link href={`/admin/events/${event.id}/mailing-list`} className="font-semibold text-primary hover:underline">
            Mailing list for flyers
          </Link>
          {removedCount > 0 && <span className="text-neutral-500"> · {removedCount} removed from this event</span>}
        </p>
      )}
      <InvitationsManager eventId={event.id} rows={rows} callList={callRows} canViewPHI={canPHI} virtualLock={virtualBlock} warning={namesCondition ? CONDITION_WARNING[warnLocale] : null} />
    </div>
  );
}
