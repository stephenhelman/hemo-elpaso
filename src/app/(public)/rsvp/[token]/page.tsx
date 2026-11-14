import type { Metadata } from "next";
import { resolveRsvpToken } from "@/lib/rsvp";
import { decryptCheckInToken } from "@/lib/crypto/checkin-token";
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

  const props: RsvpPanelProps = ctx
    ? {
        valid: true,
        token: params.token,
        via: ctx.via,
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
        confirmed: !!ctx.rsvp,
        declined: ctx.invitation?.status === "rsvp_no" && !ctx.rsvp,
      }
    : { valid: false };

  return (
    <div className="bg-neutral-50 min-h-[70vh] px-4 py-12">
      <div className="max-w-xl mx-auto">
        <RsvpPanel {...props} />
      </div>
    </div>
  );
}
