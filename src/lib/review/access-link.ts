import crypto from "crypto";
import { AuditAction } from "@prisma/client";
import { render } from "@react-email/render";
import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/tokens";
import { formatEventDate, formatEventTime } from "@/lib/datetime";
import { siteUrl, withLang } from "@/lib/site";
import { sendLoggedEmail } from "@/lib/email/send";
import { currentConsents, PATIENT_ONLY } from "@/lib/patients/query";
import { isValidEmail, normalizeEmail } from "@/lib/patients/normalize";
import { eventHasEnded } from "@/lib/rsvp/window";
import RsvpAccessLinkEmail from "@/messages/RsvpAccessLinkEmail";
import { decideRsvpPath } from "@/lib/rsvp/request-rules";
import { getGateCutoff } from "./service";

/** "Email me an RSVP link" limits. Counted from audit rows, so they hold across serverless instances. */
export const LINK_LIMIT_PER_IP = { max: 5, windowMs: 10 * 60_000 };
export const LINK_LIMIT_PER_HOUSEHOLD = { max: 3, windowMs: 60 * 60_000 };
export const LINK_TTL_MS = 7 * 24 * 60 * 60_000;
/** Every answer takes at least this long, so a registered address can't be told apart by response time. */
export const MIN_RESPONSE_MS = 1500;

export type LinkOutcome = "sent" | "unknown_email" | "not_eligible" | "household_limited" | "send_failed" | "rate_limited" | "invalid_email" | "no_event";

/** Salted hash of the caller's IP: enough to rate-limit, not enough to identify a person. */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.RATE_LIMIT_SALT || process.env.AUTH0_SECRET || "hoep";
  return crypto.createHash("sha256").update(`${salt}|${ip}`).digest("hex").slice(0, 32);
}

/**
 * Handle one "email me an RSVP link" request. The CALLER shows the same neutral answer for every outcome except
 * invalid_email and rate_limited (which depend only on the input and the caller, never on who is registered).
 * Audit rows: ids and the outcome code only. The typed address is never stored or logged.
 */
export async function requestRsvpLink(input: { eventId: unknown; email: unknown; ipHash: string | null; now?: Date }): Promise<LinkOutcome> {
  const now = input.now ?? new Date();
  const eventId = typeof input.eventId === "string" ? input.eventId : "";
  const log = (outcome: LinkOutcome, householdId: string | null) =>
    prisma.auditLog.create({
      data: {
        actorType: "public", action: AuditAction.RSVP_LINK_REQUESTED, resourceType: "Event", resourceId: eventId || null, ipAddress: input.ipHash,
        details: `RSVP link requested: ${outcome}`, changes: { eventId: eventId || null, householdId, outcome },
      },
    });

  const email = normalizeEmail(input.email);
  if (!email || !isValidEmail(email)) return "invalid_email";

  if (input.ipHash) {
    const recent = await prisma.auditLog.count({
      where: { action: AuditAction.RSVP_LINK_REQUESTED, ipAddress: input.ipHash, createdAt: { gte: new Date(now.getTime() - LINK_LIMIT_PER_IP.windowMs) } },
    });
    if (recent >= LINK_LIMIT_PER_IP.max) return "rate_limited"; // not logged again: it would only extend the window
  }

  const event = eventId
    ? await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, status: true, eventDate: true, endDate: true, rsvpDeadline: true, titleEn: true, titleEs: true, allowUninvitedRequests: true },
      })
    : null;
  if (!event || event.status !== "published") { await log("no_event", null); return "no_event"; }

  const p = await prisma.patient.findFirst({
    where: { email, ...PATIENT_ONLY },
    select: { id: true, preferredLanguage: true, reviewStatus: true, email: true, contactProfile: { select: { firstName: true } }, consentRecords: { select: { type: true, granted: true, createdAt: true } } },
  });
  if (!p) { await log("unknown_email", null); return "unknown_email"; }

  const [invitation, cutoff] = await Promise.all([
    prisma.invitation.findUnique({ where: { eventId_patientId: { eventId: event.id, patientId: p.id } }, select: { createdAt: true, status: true } }),
    getGateCutoff(),
  ]);
  // Everyone registered gets the link (the RSVP page lets an invited, approved household RSVP and anyone else ask to attend).
  // Only an invitation-only event refuses households it didn't invite. The reply to the caller is the same neutral one either way.
  const decision = decideRsvpPath({ reviewStatus: p.reviewStatus, invitation, event, cutoff });
  const closed = eventHasEnded(event, now) || (!!event.rsvpDeadline && event.rsvpDeadline < now);
  if (decision.path === "refuse" || closed || currentConsents(p.consentRecords).data_and_contact !== true) { await log("not_eligible", p.id); return "not_eligible"; }

  const perHousehold = await prisma.rsvpAccessLink.count({
    where: { patientId: p.id, createdAt: { gte: new Date(now.getTime() - LINK_LIMIT_PER_HOUSEHOLD.windowMs) } },
  });
  if (perHousehold >= LINK_LIMIT_PER_HOUSEHOLD.max) { await log("household_limited", p.id); return "household_limited"; }

  const token = generateToken();
  const expiresAt = new Date(Math.min(now.getTime() + LINK_TTL_MS, new Date(event.endDate ?? event.eventDate).getTime() + 12 * 60 * 60_000));
  await prisma.rsvpAccessLink.create({ data: { eventId: event.id, patientId: p.id, tokenHash: hashToken(token), expiresAt } });

  const lang = p.preferredLanguage === "es" ? "es" : "en";
  const html = await render(RsvpAccessLinkEmail({
    lang, firstName: p.contactProfile?.firstName ?? "", eventTitle: lang === "es" ? event.titleEs : event.titleEn,
    eventDate: formatEventDate(event.eventDate, lang), eventTime: formatEventTime(event.eventDate, lang),
    rsvpUrl: withLang(`${siteUrl()}/rsvp/${token}`, lang),
  }));
  const res = await sendLoggedEmail({
    sender: "events", kind: "RSVP_ACCESS_LINK", to: p.email!, patientId: p.id, html,
    subject: lang === "es" ? "Su enlace para confirmar asistencia" : "Your RSVP link",
  });
  const outcome: LinkOutcome = res.ok ? "sent" : "send_failed";
  await log(outcome, p.id);
  return outcome;
}
