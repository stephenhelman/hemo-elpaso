import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Printer, Users, XCircle } from "lucide-react";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import ManualCheckInButton from "@/components/admin/ManualCheckInButton";
import AddRsvpPanel from "@/components/admin/AddRsvpPanel";
import { StatCard } from "@/components/ui/StatCard";
import { PATIENT_ONLY } from "@/lib/patients/query";

export default async function EventAttendeesPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { addPatient?: string };
}) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageEvents")) redirect("/admin/dashboard");

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      rsvps: {
        where: { cancelledAt: null },
        include: { patient: { include: { contactProfile: true } } },
        orderBy: { rsvpDate: "desc" },
      },
      checkIns: { include: { patient: { include: { contactProfile: true } } }, orderBy: { checkInTime: "desc" } },
    },
  });
  if (!event) notFound();

  const pre = searchParams.addPatient
    ? await prisma.patient.findFirst({ where: { id: searchParams.addPatient, ...PATIENT_ONLY }, include: { contactProfile: true } })
    : null;

  const checkedInIds = new Set(event.checkIns.map((c) => c.patientId));
  const notCheckedIn = event.rsvps.filter((r) => !checkedInIds.has(r.patientId));
  const rsvpPeople = event.rsvps.reduce((n, r) => n + r.attendeeCount, 0);
  const rsvpOf = new Map(event.rsvps.map((r) => [r.patientId, r]));
  // People actually present: the headcount confirmed at the door (fallback: RSVP party size)
  const headcount = event.checkIns.reduce((n, c) => n + (c.headcount ?? rsvpOf.get(c.patientId)?.attendeeCount ?? 1), 0);
  const nm = (p: { contactProfile: { firstName: string; lastName: string } | null }) =>
    p.contactProfile ? `${p.contactProfile.firstName} ${p.contactProfile.lastName}` : "—";

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin/events" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">{event.titleEn}</h1>
            <Link
              href={`/admin/events/${event.id}/print`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50"
            >
              <Printer className="w-4 h-4" /> Print sign-in sheet
            </Link>
          </div>
          <p className="text-neutral-500">
            {new Date(event.eventDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<Users className="w-6 h-6" />} label="RSVP'd (parties)" value={event.rsvps.length.toString()} color="blue" />
          <StatCard icon={<Users className="w-6 h-6" />} label="RSVP'd (people)" value={rsvpPeople.toString()} subtitle={event.maxCapacity ? `of ${event.maxCapacity} capacity` : undefined} color="purple" />
          <StatCard icon={<CheckCircle className="w-6 h-6" />} label="Checked in (parties)" value={event.checkIns.length.toString()} color="green" />
          <StatCard icon={<CheckCircle className="w-6 h-6" />} label="Checked in (people)" value={headcount.toString()} color="teal" />
        </div>

        <AddRsvpPanel
          eventId={event.id}
          preselect={pre ? { id: pre.id, name: `${pre.contactProfile?.firstName ?? ""} ${pre.contactProfile?.lastName ?? ""}`.trim(), email: pre.email, phone: pre.contactProfile?.phone ?? null } : undefined}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-neutral-200">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="font-display font-bold text-neutral-900 text-xl">Not Checked In ({notCheckedIn.length})</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {notCheckedIn.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-neutral-400">Everyone is checked in!</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {notCheckedIn.map((r) => (
                    <div key={r.id} className="p-4 hover:bg-neutral-50 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-neutral-900">{nm(r.patient)}</p>
                        <p className="text-sm text-neutral-500">
                          Party of {r.attendeeCount} · {r.source}
                          {r.patient.contactProfile?.phone ? ` · ${r.patient.contactProfile.phone}` : ""}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">RSVP&apos;d {new Date(r.rsvpDate).toLocaleDateString()}</p>
                      </div>
                      <ManualCheckInButton rsvpId={r.id} eventId={event.id} isCheckedIn={false} patientName={nm(r.patient)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="font-display font-bold text-neutral-900 text-xl">Checked In ({event.checkIns.length})</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {event.checkIns.length === 0 ? (
                <div className="p-8 text-center">
                  <XCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-400">No check-ins yet</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {event.checkIns.map((c) => {
                    const r = rsvpOf.get(c.patientId);
                    return (
                      <div key={c.id} className="p-4 hover:bg-neutral-50 flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-neutral-900">{nm(c.patient)}</p>
                          <p className="text-sm text-neutral-500">
                            {c.headcount ?? r?.attendeeCount ?? 1} present{r ? ` (RSVP'd ${r.attendeeCount})` : " (walk-in)"}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            Checked in {new Date(c.checkInTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                        <ManualCheckInButton checkInId={c.id} eventId={c.eventId} patientName={nm(c.patient)} isCheckedIn={true} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
