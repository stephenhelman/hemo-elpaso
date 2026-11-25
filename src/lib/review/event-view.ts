import { prisma } from "@/lib/db";
import { resolveSession } from "@/lib/identity/session";
import { selectableMembers } from "@/lib/rsvp/attendees";
import { rsvpGate } from "./service";

/** What the RSVP area of an event page shows THIS visitor. Names/relationship/age group only; no diagnoses, no emails. */
export type EventRsvpView =
  | { kind: "anon" }
  | { kind: "review" } // signed in, household not approved
  | { kind: "invitation_only" } // signed in and approved, but this event needs an invitation
  | { kind: "already"; partySize: number }
  | { kind: "member"; firstName: string; options: { id: string; label: string; relationship: string; ageGroup: string; status: string }[] };

export async function eventRsvpView(eventId: string): Promise<EventRsvpView> {
  const s = await resolveSession().catch(() => null);
  if (!s?.patient || !s.actor || s.mode === "none" || !s.hasHousehold) return { kind: "anon" };
  const householdId = s.patient.id;

  const existing = await prisma.rsvp.findFirst({ where: { eventId, patientId: householdId, cancelledAt: null }, select: { attendeeCount: true } });
  if (existing) return { kind: "already", partySize: existing.attendeeCount };

  const gate = await rsvpGate(eventId, householdId);
  if (!gate.ok) return { kind: gate.code === "NOT_APPROVED" ? "review" : "invitation_only" };

  const [members, p] = await Promise.all([
    selectableMembers(householdId),
    prisma.patient.findUnique({ where: { id: householdId }, select: { contactProfile: { select: { firstName: true } } } }),
  ]);
  return {
    kind: "member", firstName: p?.contactProfile?.firstName ?? "",
    options: members.map((m) => ({ id: m.id, label: m.firstName ?? "", relationship: m.relationship, ageGroup: m.ageGroup, status: m.status })),
  };
}
