import { prisma } from "@/lib/db";
import { hasCompleteAddress, isFlyerDelivery } from "@/lib/flyers";
import { isUnstructuredAddress } from "@/lib/review/rules";
import { loadHousehold, type PortalHousehold } from "./household";
import { currentValue, type ConsentRow } from "./rules";
import { actorMemberId, isGuardianOf, needsAgeCheck, type Actor, type GuardianshipFacts } from "./permissions";

export interface ViewMember {
  id: string; firstName: string | null; lastName: string | null; relationship: string; ageGroup: string; status: string;
  isMe: boolean; minor: boolean;
  /** A minor's diagnoses: only for the primary and an attested guardian. null = not visible to this person. */
  diagnoses: string[] | null;
  canEdit: boolean; canSetDiagnoses: boolean; canConvert: boolean; canRemove: boolean;
  ageCheck: boolean;
  /** Primary only: this minor's designated guardians (names + whether they attested). */
  guardians: { memberId: string; name: string; attested: boolean }[] | null;
}
export interface PortalView {
  actor: Actor;
  household: Pick<PortalHousehold, "upcoming" | "past" | "invited" | "language">;
  me: { firstName: string; lastName: string; phone: string | null; email: string | null; language: "en" | "es"; diagnoses: string[] };
  address: { line1: string; line2: string; city: string; state: string; zip: string; unstructured: boolean } | null;
  /** Registration review: anything but approved shows the "we're reviewing your registration" note. The hold reason is never shown to the family. */
  reviewStatus: string;
  /** Household-level flyer preference (email | mail | none), plus what the choices depend on. */
  flyerDelivery: { value: "email" | "mail" | "none"; hasEmail: boolean; hasAddress: boolean };
  consents: { data_and_contact: boolean | null; media: boolean | null; sms: boolean | null; newsletter: boolean | null };
  members: ViewMember[];
  /** Confirmed adults other than me (the primary may designate them as guardians). Names only. */
  otherAdults: { id: string; name: string }[];
  /** Minors an adult was designated guardian of but has not yet attested (the blocking card). */
  pendingAttestations: { childMemberId: string; childName: string }[];
  householdFirstName: string;
  /** The household's primary contact, shown to the other adults. */
  primaryName: string;
}

const name = (m: { firstName: string | null; lastName: string | null }) => [m.firstName, m.lastName].filter(Boolean).join(" ") || "—";

/**
 * What the family page shows to ONE person. The household and the actor come from the session. Another adult's
 * consents, email, phone and diagnoses are never loaded here; a minor's diagnoses only for the primary and an attested guardian.
 */
export async function loadPortalView(householdId: string, actor: Actor, now = new Date()): Promise<PortalView | null> {
  const base = await loadHousehold(householdId, now);
  if (!base) return null;
  const [p, members, gs] = await Promise.all([
    prisma.patient.findUnique({ where: { id: householdId }, select: { email: true, flyerDelivery: true, preferredLanguage: true, primaryDiagnoses: true, reviewStatus: true, contactProfile: { select: { firstName: true, lastName: true, phone: true, addressLine1: true, addressLine2: true, city: true, state: true, zipCode: true } } } }),
    prisma.householdMember.findMany({ where: { patientId: householdId }, orderBy: { createdAt: "asc" } }),
    prisma.memberGuardianship.findMany({ where: { child: { patientId: householdId } }, select: { childMemberId: true, guardianMemberId: true, attestedAt: true } }),
  ]);
  if (!p) return null;
  const guards: GuardianshipFacts[] = gs;
  const meId = actorMemberId(actor);
  const meRow = meId ? members.find((m) => m.id === meId && m.status === "confirmed") ?? null : null;
  if (actor.kind === "member" && !meRow) return null;

  const consentRows: ConsentRow[] = meRow
    ? await prisma.consentRecord.findMany({ where: { householdMemberId: meRow.id }, select: { type: true, granted: true, createdAt: true } })
    : await prisma.consentRecord.findMany({ where: { patientId: householdId }, select: { type: true, granted: true, createdAt: true } });

  const byId = new Map(members.map((m) => [m.id, m]));
  const view: ViewMember[] = members
    .filter((m) => m.status !== "declined" && m.status !== "expired")
    .map((m) => {
      const minor = m.ageGroup !== "18_plus";
      const guardian = minor && isGuardianOf(actor, m.id, guards);
      return {
        id: m.id, firstName: m.firstName, lastName: m.lastName, relationship: m.relationship, ageGroup: m.ageGroup, status: m.status,
        isMe: m.id === meId, minor,
        diagnoses: minor && guardian ? m.statedDiagnoses : null,
        canEdit: minor, canSetDiagnoses: guardian, canConvert: guardian,
        canRemove: actor.kind === "primary",
        ageCheck: minor && needsAgeCheck(m, now),
        guardians: actor.kind === "primary" && minor
          ? guards.filter((g) => g.childMemberId === m.id).map((g) => ({ memberId: g.guardianMemberId, name: name(byId.get(g.guardianMemberId) ?? { firstName: null, lastName: null }), attested: g.attestedAt !== null }))
          : null,
      };
    });

  return {
    actor,
    household: { upcoming: base.upcoming, past: base.past, invited: base.invited, language: base.language },
    householdFirstName: p.contactProfile?.firstName ?? "",
    primaryName: [p.contactProfile?.firstName, p.contactProfile?.lastName].filter(Boolean).join(" "),
    me: meRow
      ? { firstName: meRow.firstName ?? "", lastName: meRow.lastName ?? "", phone: meRow.phone, email: meRow.email, language: (meRow.preferredLanguage ?? p.preferredLanguage) === "es" ? "es" : "en", diagnoses: meRow.statedDiagnoses }
      : { firstName: p.contactProfile?.firstName ?? "", lastName: p.contactProfile?.lastName ?? "", phone: p.contactProfile?.phone ?? null, email: p.email, language: p.preferredLanguage === "es" ? "es" : "en", diagnoses: p.primaryDiagnoses },
    address: p.contactProfile?.addressLine1
      ? { line1: p.contactProfile.addressLine1, line2: p.contactProfile.addressLine2 ?? "", city: p.contactProfile.city ?? "", state: p.contactProfile.state ?? "TX", zip: p.contactProfile.zipCode ?? "", unstructured: isUnstructuredAddress(p.contactProfile) }
      : null,
    reviewStatus: p.reviewStatus,
    flyerDelivery: { value: isFlyerDelivery(p.flyerDelivery) ? p.flyerDelivery : "none", hasEmail: !!p.email?.trim(), hasAddress: hasCompleteAddress(p.contactProfile) },
    consents: {
      data_and_contact: currentValue(consentRows, "data_and_contact"), media: currentValue(consentRows, "media"),
      sms: currentValue(consentRows, "sms"), newsletter: currentValue(consentRows, "newsletter"),
    },
    members: view,
    otherAdults: members.filter((m) => m.ageGroup === "18_plus" && m.status === "confirmed" && m.id !== meId).map((m) => ({ id: m.id, name: name(m) })),
    pendingAttestations: meRow
      ? guards.filter((g) => g.guardianMemberId === meRow.id && g.attestedAt === null).map((g) => ({ childMemberId: g.childMemberId, childName: name(byId.get(g.childMemberId) ?? { firstName: null, lastName: null }) }))
      : [],
  };
}
