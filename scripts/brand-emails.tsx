/**
 * Renders every HOEP email with sample data.
 *   npx tsx scripts/brand-emails.tsx preview <outDir>      # HTML files for screenshots (header from the local file)
 *   npx tsx scripts/brand-emails.tsx send <to-address>      # sends ONE test of each kind via Resend
 * `send` uses the real RESEND_API_KEY/EMAIL_FROM from .env.local and attaches the header image inline (CID),
 * because the public URL only works after the site is deployed. Subjects are prefixed "[brand test]".
 */
import fs from "node:fs";
import path from "node:path";
import React from "react";

try { process.loadEnvFile(".env.local"); } catch {}
const mode = process.argv[2];
const arg = process.argv[3];

(globalThis as any).React = React;
// Links in the samples point at the documented public URL; previews load the header straight from disk.
process.env.NEXT_PUBLIC_SITE_URL = mode === "preview" ? `file://${path.join(process.cwd(), "public")}` : "https://hemoelpaso.org";

async function main() {
  const { render } = await import("@react-email/render");
  const { default: RsvpEmail } = await import("../src/messages/RsvpEmail");
  const { default: EventInvitation } = await import("../src/messages/EventInvitation");
  const { default: RegistrationInfoConfirmation } = await import("../src/messages/RegistrationInfoConfirmation");
  const { default: ContactAutoReply } = await import("../src/messages/ContactAutoReply");
  const { default: BoardRoleAssigned } = await import("../src/messages/BoardRoleAssigned");
  const { default: ContactFormNotification } = await import("../src/messages/ContactFormNotification");
  const { default: EventPublished } = await import("../src/messages/EventPublished");
  const { default: EventCancelled } = await import("../src/messages/EventCancelled");
  const { default: CheckInConfirmation } = await import("../src/messages/CheckInConfirmation");

  const ev = { eventTitle: "Winter Family Gathering", eventDate: "Saturday, December 13, 2026", eventTime: "10:00 AM", location: "El Paso Community Center" };
  const base = "https://hemoelpaso.org";
  const rsvp = { ...ev, firstName: "María", partySize: 3, rsvpUrl: `${base}/rsvp/SAMPLE-TOKEN?lang=es`, qrUrl: `${base}/api/checkin-qr/SAMPLE-TOKEN` };

  // [name, subject, element, sentInTest]
  const list: [string, string, React.ReactElement, boolean][] = [
    ["invitation", "You're invited: Winter Family Gathering", <EventInvitation lang="en" firstName="María" {...ev} description="Join us for food, games and a chance to meet other families." rsvpUrl={`${base}/rsvp/SAMPLE-TOKEN?lang=en`} unsubscribeUrl={`${base}/api/unsubscribe?token=SAMPLE&lang=en`} />, true],
    ["rsvp-confirmation", "RSVP confirmed: Winter Family Gathering", <RsvpEmail kind="confirmation" lang="es" {...rsvp} />, true],
    ["rsvp-reminder", "Recordatorio: Winter Family Gathering es mañana", <RsvpEmail kind="reminder" lang="es" {...rsvp} />, true],
    ["rsvp-cancelled", "RSVP cancelled: Winter Family Gathering", <RsvpEmail kind="cancelled" lang="en" {...rsvp} />, true],
    ["register-info-confirmation", "Thanks for registering with HOEP", <RegistrationInfoConfirmation lang="en" firstName="María" />, true],
    ["contact-auto-reply", "We received your message — HOEP", <ContactAutoReply lang="en" name={'María <b>"x"</b> & Co'} reasonLabel="Volunteering" />, true],
    ["board-role-assigned", "You've been assigned a board role at HOEP", <BoardRoleAssigned lang="en" patientName="María Pérez" roleTitle="Secretary" roleEmail="secretary@hemo-el-paso.org" dashboardUrl={`${base}/admin`} />, true],
    ["contact-notification", "New message: Volunteering (internal)", <ContactFormNotification name="María" email="maria@example.com" phone="(915) 555-0100" reason="volunteer" message={"Hello,\nI would like to help at events."} locale="en" />, false],
    ["event-published", "New event: Winter Family Gathering", <EventPublished patientName="María" {...ev} description="Food, games and community." eventSlug="winter-2026" />, false],
    ["event-cancelled", "Event cancelled: Winter Family Gathering", <EventCancelled patientName="María" {...ev} cancellationReason="Venue unavailable" />, false],
    ["check-in", "Welcome to Winter Family Gathering!", <CheckInConfirmation patientName="María" {...ev} checkInTime="9:55 AM" />, false],
  ];

  if (mode === "preview") {
    fs.mkdirSync(arg, { recursive: true });
    for (const [name, , el] of list) fs.writeFileSync(path.join(arg, `${name}.html`), await render(el));
    console.log(`rendered ${list.length} emails to ${arg}`);
    return;
  }
  if (mode === "send") {
    if (!arg?.includes("@")) throw new Error("usage: send <address>");
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const header = fs.readFileSync("public/brand/email-header.png");
    const from = process.env.EMAIL_FROM || "HOEP <onboarding@resend.dev>";
    for (const [name, subject, el, send] of list) {
      if (!send) continue;
      // inline the header so the test shows it before the site (and /brand/email-header.png) is deployed
      const html = (await render(el)).replace(`${base}/brand/email-header.png`, "cid:hoep-header");
      const res = await resend.emails.send({
        from, to: arg, subject: `[brand test] ${subject}`, html,
        attachments: [{ filename: "email-header.png", content: header, contentId: "hoep-header" } as any],
      });
      console.log(name.padEnd(28), res.error ? `ERROR ${res.error.name}: ${res.error.message}` : `id ${res.data?.id}`);
    }
    return;
  }
  throw new Error("usage: preview <dir> | send <address>");
}
main().catch((e) => { console.error(e); process.exit(1); });
