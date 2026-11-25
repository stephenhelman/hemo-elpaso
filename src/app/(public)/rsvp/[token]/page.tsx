import type { Metadata } from "next";
import { resolveRsvpToken } from "@/lib/rsvp";
import { decryptCheckInToken } from "@/lib/crypto/checkin-token";
import { selectableMembers } from "@/lib/rsvp/attendees";
import { prisma } from "@/lib/db";
import { getGateCutoff } from "@/lib/review/service";
import { decideRsvpPath, mayResubmit } from "@/lib/rsvp/request-rules";
import { getLocaleCookie } from "@/lib/locale";
import LegalLinks from "@/components/legal/LegalLinks";
import RsvpPanel, { type RsvpPanelProps } from "@/components/rsvp/RsvpPanel";

// Personal link: never index, never leak the token via Referer.
export const metadata: Metadata = {
  title: "RSVP",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

export default async function RsvpTokenPage({ params }: { params: { token: string } }) {
  const ctx = await resolveRsvpToken(params.token);

  // Household people for the "who is coming" checklist (names/relationship/age group only; no diagnoses).
  const members = ctx ? await selectableMembers(ctx.patient.id) : [];
  const attendees = ctx?.rsvp ? await prisma.rsvpAttendee.findMany({ where: { rsvpId: ctx.rsvp.id }, select: { isPrimary: true, householdMemberId: true } }) : [];

  // No active RSVP: an invited, approved household RSVPs here; anyone else sends a request (or sees the status of the one it has).
  let mode: "rsvp" | "request" | "invitation" | "blocked" = "rsvp";
  let reviewing = false;
  let openRequest: { id: string; status: string } | null = null;
  if (ctx && !ctx.rsvp) {
    const [inv, cutoff, open, last] = await Promise.all([
      prisma.invitation.findUnique({ where: { eventId_patientId: { eventId: ctx.event.id, patientId: ctx.patient.id } }, select: { createdAt: true, status: true } }),
      getGateCutoff(),
      prisma.rsvpRequest.findFirst({ where: { eventId: ctx.event.id, patientId: ctx.patient.id, status: { in: ["waiting_household_review", "pending", "waitlisted"] } }, select: { id: true, status: true } }),
      prisma.rsvpRequest.findFirst({ where: { eventId: ctx.event.id, patientId: ctx.patient.id }, orderBy: { createdAt: "desc" }, select: { status: true, declineReason: true } }),
    ]);
    const path = decideRsvpPath({ reviewStatus: ctx.patient.reviewStatus, invitation: inv, event: ctx.event, cutoff });
    openRequest = open;
    if (path.path === "refuse") mode = "invitation";
    else if (path.path === "request") { mode = open ? "request" : mayResubmit(last) ? "request" : "blocked"; reviewing = path.initialStatus === "waiting_household_review"; }
  }

  const props: RsvpPanelProps = ctx
    ? {
        valid: true,
        token: params.token,
        via: ctx.via,
        mode, reviewing, openRequest,
        attendanceType: ctx.rsvp?.attendanceType === "virtual" ? "virtual" : "in_person",
        // the RSVP's QR token, shown even when the visitor arrived via the invitation link
        qrToken: ctx.via === "checkin" ? params.token : decryptCheckInToken(ctx.rsvp?.checkInTokenEnc),
        firstName: ctx.patient.contactProfile?.firstName ?? "",
        hasEmail: !!ctx.patient.email,
        event: {
          titleEn: ctx.event.titleEn,
          titleEs: ctx.event.titleEs,
          eventDate: ctx.event.eventDate.toISOString(),
          location: ctx.event.location,
        },
        ended: ctx.ended,
        partySize: ctx.rsvp?.attendeeCount ?? Math.max(1, ctx.patient.familySize),
        options: members.map((m) => ({ id: m.id, label: m.firstName ?? "", relationship: m.relationship, ageGroup: m.ageGroup, status: m.status })),
        selected: ctx.rsvp
          ? { primary: attendees.some((a) => a.isPrimary), memberIds: attendees.map((a) => a.householdMemberId).filter((x): x is string => !!x), guests: ctx.rsvp.guestCount }
          : { primary: true, memberIds: members.map((m) => m.id), guests: 0 }, // all checked by default
        confirmed: !!ctx.rsvp,
        declined: ctx.invitation?.status === "rsvp_no" && !ctx.rsvp,
      }
    : { valid: false };

  const locale = (await getLocaleCookie()) === "es" ? "es" : "en";
  return (
    <div className="bg-neutral-50 min-h-[70vh] px-4 py-12">
      <div className="max-w-xl mx-auto">
        <RsvpPanel {...props} />
        <LegalLinks locale={locale} which={["privacy"]} newTab={false} className="mt-6 text-center text-xs text-neutral-500" />
      </div>
    </div>
  );
}
