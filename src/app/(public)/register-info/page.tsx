import RegisterInfoForm from "@/components/register-info/RegisterInfoForm";
import RegisterInfoHeading from "@/components/register-info/RegisterInfoHeading";
import RegistrationClosed from "@/components/register-info/RegistrationClosed";
import { prisma } from "@/lib/db";
import { requestWindowOpen } from "@/lib/rsvp/request-rules";
import { registrationOpen } from "@/lib/registration";
import { addressAutocompleteEnabled } from "@/lib/address/server";

export const dynamic = "force-dynamic"; // REGISTRATION_OPEN is read at request time

export default async function RegisterInfoPage({ searchParams }: { searchParams?: { event?: string; mode?: string } }) {
  if (!registrationOpen()) return <RegistrationClosed />;

  // Read at request time on the server; the public site key is handed to the client form.
  // "?event=<id>" from the RSVP modal: carried only if that event can take a request (an id, never a title).
  const wanted = typeof searchParams?.event === "string" ? searchParams.event : "";
  const ev = wanted ? await prisma.event.findUnique({ where: { id: wanted }, select: { status: true, eventDate: true, endDate: true, rsvpDeadline: true, allowUninvitedRequests: true } }) : null;
  const eventId = ev && ev.allowUninvitedRequests && requestWindowOpen(ev) ? wanted : null;
  const phoneOnly = searchParams?.mode === "phone";
  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY ?? null;
  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-12 max-w-2xl mx-auto">
        <RegisterInfoHeading />
        <RegisterInfoForm eventId={eventId} phoneOnly={phoneOnly} turnstileSiteKey={turnstileSiteKey} addressAutocomplete={await addressAutocompleteEnabled()} />
      </div>
    </div>
  );
}
