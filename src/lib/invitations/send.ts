import { formatEventDate, formatEventTime } from "@/lib/datetime";
import { siteUrl, withLang } from "@/lib/site";
import { render } from "@react-email/render";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendLoggedEmail } from "@/lib/email/send";
import { generateToken, hashToken } from "@/lib/tokens";
import { generateUnsubscribeToken } from "@/lib/unsubscribe-token";
import { currentConsents } from "@/lib/patients/query";
import EventInvitation from "@/messages/EventInvitation";
import { emailBlocker } from "./match";
import { invitationFlyer } from "@/lib/flyers";
import { getGateCutoff } from "@/lib/review/service";
import { alsoSendRecipients } from "@/lib/households/also-send";
import { isFeatureEnabled } from "@/lib/features";
import { invitationGrandfathered } from "@/lib/review/rules";

const baseUrl = () => siteUrl();

export function pendingInvitationCount(eventId: string) {
  return prisma.invitation.count({ where: { eventId, status: "pending" } });
}

/**
 * Send every PENDING invitation for an event. Consent/email/opt-out are
 * re-checked at send time. A fresh token is minted per send (its hash replaces
 * the placeholder). Failed sends stay pending. Rows already sent are never
 * re-sent. The audit entry records the event id and count only.
 */
export async function sendInvitations(eventId: string, adminId: string, opts: { recordingsOn?: boolean } = {}) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { sent: 0, failed: 0, skipped: 0, errors: [] as string[] };

  const pending = await prisma.invitation.findMany({
    where: { eventId, status: "pending" },
    include: { patient: { include: { contactProfile: true, consentRecords: true } } },
  });

  const cutoff = await getGateCutoff();
  // Virtual links go only into invitations marked virtual, and only while virtual attendance is allowed (event option + "recordings" toggle).
  const virtualOk = !!event.virtualEnabled && !!event.meetUrl && !!event.youtubeUrl && (opts.recordingsOn ?? (await isFeatureEnabled("recordings")));
  let sent = 0, failed = 0, skipped = 0;
  const errors = new Set<string>(); // Resend error NAMES only
  for (const inv of pending) {
    const p = inv.patient;
    // Registration review: only approved households are emailed, unless the invitation predates the gate (grandfathered).
    if (p.reviewStatus !== "approved" && !invitationGrandfathered(inv, cutoff)) {
      skipped++;
      continue;
    }
    const blocker = emailBlocker({
      email: p.email,
      emailOptOut: p.emailOptOut,
      consentData: currentConsents(p.consentRecords).data_and_contact,
    });
    if (blocker) {
      skipped++;
      continue;
    }
    const lang = p.preferredLanguage === "es" ? "es" : "en";
    const token = generateToken();
    try {
      const date = event.eventDate;
      const virtual = virtualOk && inv.attendanceType === "virtual" ? { meetUrl: event.meetUrl!, youtubeUrl: event.youtubeUrl! } : null;
      const build = async (toLang: "en" | "es") =>
        render(
          EventInvitation({
            lang: toLang,
            firstName: p.contactProfile?.firstName ?? "",
            eventTitle: toLang === "es" ? event.titleEs : event.titleEn,
            eventDate: formatEventDate(date, toLang),
            eventTime: formatEventTime(date, toLang),
            location: event.location,
            description:
              (toLang === "es" ? event.descriptionEs : event.descriptionEn)?.slice(0, 500) ?? undefined,
            rsvpUrl: withLang(`${baseUrl()}/rsvp/${token}`, toLang),
            flyer: invitationFlyer(event, p.flyerDelivery, toLang, toLang === "es" ? event.titleEs : event.titleEn),
            virtual,
            unsubscribeUrl: withLang(`${baseUrl()}/api/unsubscribe?token=${generateUnsubscribeToken(p.id)}`, toLang),
          }),
        );
      const html = await build(lang);
      const subjectFor = (l: "en" | "es") => (l === "es" ? `Estás invitado/a: ${event.titleEs}` : `You're invited: ${event.titleEn}`);
      // Store the new hash BEFORE sending so the link works as soon as it lands.
      await prisma.invitation.update({
        where: { id: inv.id },
        data: { tokenHash: hashToken(token) },
      });
      const res = await sendLoggedEmail({
        sender: "events",
        kind: "EVENT_INVITATION",
        to: p.email!,
        subject: subjectFor(lang),
        html,
        patientId: p.id,
      });
      if (res.ok) {
        // "Also send invitations to": confirmed adults the household chose get the same invitation (best effort).
        for (const extra of await alsoSendRecipients(p.id).catch(() => [])) {
          const l = extra.language ?? lang;
          await sendLoggedEmail({ sender: "events", kind: "EVENT_INVITATION", to: extra.email, subject: subjectFor(l), html: await build(l), patientId: p.id }).catch(() => null);
        }
      }
      if (!res.ok) {
        // Not accepted by Resend: stays pending so it can be retried.
        errors.add(res.errorName);
        failed++;
        continue;
      }
      await prisma.invitation.update({
        where: { id: inv.id },
        data: { status: "sent", sentAt: new Date(), sentByBoardUserId: adminId },
      });
      sent++;
    } catch {
      failed++; // stays pending; no details logged (recipient is PII)
    }
  }

  await prisma.auditLog.create({
    data: {
      patientId: adminId,
      action: AuditAction.INVITATIONS_SENT,
      resourceType: "Event",
      resourceId: eventId,
      details: `Sent ${sent} invitations (${failed} failed, ${skipped} skipped)`,
    },
  });
  return { sent, failed, skipped, errors: Array.from(errors) };
}
