import { prisma } from "@/lib/db";
import { resolveSession } from "@/lib/identity/session";
import { selectableMembers } from "@/lib/rsvp/attendees";
import { decideRsvpPath, mayResubmit } from "@/lib/rsvp/request-rules";
import { getGateCutoff } from "./service";

type Option = { id: string; label: string; relationship: string; ageGroup: string; status: string };

/**
 * What the RSVP modal on an event page shows THIS visitor. Names/relationship/age group only; no diagnoses, no emails.
 * `byInvitation` (anon): the event takes no requests from uninvited households, so the modal offers only "I was invited".
 */
export type EventRsvpView =
  | { kind: "anon"; byInvitation: boolean }
  | { kind: "by_invitation" } // signed in, not invited, and this event takes no requests
  | { kind: "blocked" } // an earlier request for this event was declined in a way that doesn't reopen
  | { kind: "already"; partySize: number; attendanceType: "in_person" | "virtual" }
  | { kind: "request"; requestId: string; status: string } // an open request (waiting, pending or waitlisted)
  | { kind: "member"; firstName: string; options: Option[]; path: "direct" | "request"; reviewing: boolean };

export async function eventRsvpView(eventId: string): Promise<EventRsvpView> {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { allowUninvitedRequests: true } });
  const s = await resolveSession().catch(() => null);
  if (!s?.patient || !s.actor || s.mode === "none" || !s.hasHousehold) return { kind: "anon", byInvitation: !event?.allowUninvitedRequests };
  const householdId = s.patient.id;

  const existing = await prisma.rsvp.findFirst({ where: { eventId, patientId: householdId, cancelledAt: null }, select: { attendeeCount: true, attendanceType: true } });
  if (existing) return { kind: "already", partySize: existing.attendeeCount, attendanceType: existing.attendanceType === "virtual" ? "virtual" : "in_person" };

  const open = await prisma.rsvpRequest.findFirst({ where: { eventId, patientId: householdId, status: { in: ["waiting_household_review", "pending", "waitlisted"] } }, select: { id: true, status: true } });
  if (open) return { kind: "request", requestId: open.id, status: open.status };

  const [p, invitation, cutoff, last] = await Promise.all([
    prisma.patient.findUnique({ where: { id: householdId }, select: { reviewStatus: true, contactProfile: { select: { firstName: true } } } }),
    prisma.invitation.findUnique({ where: { eventId_patientId: { eventId, patientId: householdId } }, select: { createdAt: true, status: true } }),
    getGateCutoff(),
    prisma.rsvpRequest.findFirst({ where: { eventId, patientId: householdId }, orderBy: { createdAt: "desc" }, select: { status: true, declineReason: true } }),
  ]);
  const path = decideRsvpPath({ reviewStatus: p?.reviewStatus ?? "pending_review", invitation, event: { allowUninvitedRequests: event?.allowUninvitedRequests ?? true }, cutoff });
  if (path.path === "refuse") return { kind: "by_invitation" };
  if (path.path === "request" && !mayResubmit(last)) return { kind: "blocked" };

  const members = await selectableMembers(householdId);
  return {
    kind: "member", firstName: p?.contactProfile?.firstName ?? "",
    options: members.map((m) => ({ id: m.id, label: m.firstName ?? "", relationship: m.relationship, ageGroup: m.ageGroup, status: m.status })),
    path: path.path === "direct" ? "direct" : "request",
    reviewing: path.path === "request" && path.initialStatus === "waiting_household_review",
  };
}
