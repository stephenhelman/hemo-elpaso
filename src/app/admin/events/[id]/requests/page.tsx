import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/features";
import { eligiblePeople, householdMatchesTargeting } from "@/lib/households/eligibility";
import { confirmBlock, CONFIRM_BLOCK_TEXT } from "@/lib/rsvp/request-rules";
import RequestsManager, { type RequestRow, type DecidedRow } from "@/components/admin/requests/RequestsManager";

export const dynamic = "force-dynamic";

export default async function EventRequestsPage({ params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageEvents")) redirect("/admin/dashboard");

  const event = await prisma.event.findUnique({ where: { id: params.id }, include: { targeting: true } });
  if (!event) notFound();
  const [recordingsOn, taken, open, decided] = await Promise.all([
    isFeatureEnabled("recordings"),
    prisma.rsvp.aggregate({ where: { eventId: event.id, cancelledAt: null, attendanceType: "in_person" }, _sum: { attendeeCount: true } }),
    prisma.rsvpRequest.findMany({
      where: { eventId: event.id, status: { in: ["waiting_household_review", "pending", "waitlisted"] } },
      include: { patient: { include: { contactProfile: true, householdMembers: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.rsvpRequest.findMany({
      where: { eventId: event.id, status: { in: ["confirmed_in_person", "confirmed_virtual", "declined", "withdrawn"] } },
      include: { patient: { include: { contactProfile: true } } },
      orderBy: { updatedAt: "desc" }, take: 30,
    }),
  ]);
  const inPersonTaken = taken._sum.attendeeCount ?? 0;
  const remaining = event.maxCapacity ? Math.max(0, event.maxCapacity - inPersonTaken) : null;
  const personName = (p: { contactProfile: { firstName: string; lastName: string } | null }) => `${p.contactProfile?.firstName ?? ""} ${p.contactProfile?.lastName ?? ""}`.trim() || "—";

  const rows: RequestRow[] = open.map((r) => {
    const facts = { status: r.status, householdApproved: r.patient.reviewStatus === "approved", partySize: r.partySize, inPersonTaken, event, recordingsOn };
    const inPerson = confirmBlock({ ...facts, type: "in_person" });
    const virtual = confirmBlock({ ...facts, type: "virtual" });
    return {
      id: r.id, name: personName(r.patient), status: r.status, source: r.source, createdAt: r.createdAt.toISOString(),
      language: r.patient.preferredLanguage === "es" ? "es" : "en", partySize: r.partySize,
      // A yes/no only: the diagnoses behind it never leave the server.
      matchesTargeting: householdMatchesTargeting(eligiblePeople(r.patient.primaryDiagnoses, r.patient.householdMembers), event.targeting),
      phoneOnly: !r.patient.email && !!r.patient.contactProfile?.phone,
      inPersonBlock: inPerson ? CONFIRM_BLOCK_TEXT[inPerson] : null,
      virtualBlock: virtual ? CONFIRM_BLOCK_TEXT[virtual] : null,
      canWaitlist: r.status === "pending",
    };
  });
  const history: DecidedRow[] = decided.map((r) => ({ id: r.id, name: personName(r.patient), status: r.status, reason: r.declineReason, at: (r.decidedAt ?? r.updatedAt).toISOString(), partySize: r.partySize }));

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <Link href="/admin/events" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>
      <h1 className="text-3xl font-display font-bold text-neutral-900 mb-1">RSVP requests</h1>
      <p className="text-neutral-600 mb-2">{event.titleEn}</p>
      <p className="text-sm text-neutral-600 mb-6">
        <Link href={`/admin/events/${event.id}/invitations`} className="font-semibold text-primary hover:underline">Invitations</Link>
        {" · "}
        {event.allowUninvitedRequests ? "Requests from uninvited households are allowed." : "This event is by invitation: new requests from uninvited households are not accepted."}
      </p>
      <RequestsManager
        eventId={event.id} rows={rows} history={history}
        capacity={{ max: event.maxCapacity, taken: inPersonTaken, remaining }}
        virtual={{ enabled: event.virtualEnabled, recordingsOn }}
      />
    </div>
  );
}
