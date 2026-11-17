import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import SignInSheet from "@/components/admin/SignInSheet";
import PrintButton from "@/components/admin/PrintButton";
import { ATTENDEE_WITH_MEMBER, mapPeople } from "@/lib/rsvp/people";
import { relationshipLabels, type Relationship } from "@/lib/households/constants";

export const dynamic = "force-dynamic";

/**
 * Printable sign-in sheet for an event. Same permission as the attendees page. Only the minimum is selected from
 * the database: first/last name, party size and the latest media-consent value. No diagnoses, emails or addresses.
 */
export default async function EventPrintPage({ params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageEvents")) redirect("/admin/dashboard");

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      titleEn: true,
      eventDate: true,
      location: true,
      rsvps: {
        where: { cancelledAt: null },
        select: {
          attendeeCount: true,
          guestCount: true,
          // first names, relationship and consent flags only: nothing is selected that could carry a diagnosis
          attendees: { include: ATTENDEE_WITH_MEMBER, orderBy: { createdAt: "asc" } },
          patient: {
            select: {
              contactProfile: { select: { firstName: true, lastName: true } },
              // newest media consent only: "granted" decides the NO PHOTOS marker
              consentRecords: { where: { type: "media" }, orderBy: { createdAt: "desc" }, take: 1, select: { granted: true } },
            },
          },
        },
      },
    },
  });
  if (!event) notFound();

  // Audit: the print view was opened (event id only, no names or counts).
  await prisma.auditLog.create({
    data: { patientId: admin.id, action: "SIGNIN_SHEET_PRINTED", resourceType: "Event", resourceId: event.id },
  });

  const attendees = event.rsvps.map((r) => ({
    lastName: r.patient.contactProfile?.lastName ?? "—",
    firstName: r.patient.contactProfile?.firstName ?? "",
    partySize: r.attendeeCount,
    guests: r.guestCount,
    // per person; "latest media consent isn't granted" (refused OR none) rules, see lib/rsvp/people.ts
    people: mapPeople(r.attendees, r.patient.contactProfile?.firstName ?? "", r.patient.consentRecords[0]?.granted).map((p) => ({
      name: p.name,
      relationship: p.relationship ? relationshipLabels[p.relationship as Relationship]?.en ?? p.relationship : null,
      noPhotos: p.noPhotos,
    })),
  }));
  const totals = {
    households: event.rsvps.length,
    guests: event.rsvps.reduce((n, r) => n + r.guestCount, 0),
    people: event.rsvps.reduce((n, r) => n + r.attendeeCount, 0),
  };

  const tz = "America/Denver"; // El Paso
  const d = new Date(event.eventDate);
  const dateLine = `${d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: tz })} · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz })}`;

  return (
    <div className="p-4 md:p-8 bg-neutral-100 min-h-screen">
      <div className="no-print max-w-[8.5in] mx-auto mb-4 flex items-center justify-between">
        <Link href={`/admin/events/${event.id}/attendees`} className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to attendees
        </Link>
        <PrintButton />
      </div>
      <SignInSheet totals={totals} title={event.titleEn} dateLine={dateLine} location={event.location} attendees={attendees} />
    </div>
  );
}
