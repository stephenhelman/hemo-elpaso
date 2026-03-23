import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import { Lang } from "@/types";
import FamilyPageContent from "@/components/portal/FamilyPageContent";

export default async function FamilyPage() {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });
  if (!patient) redirect("/portal/dashboard");

  const family = await prisma.family.findFirst({
    where: {
      OR: [
        { primaryPatientId: patient.id },
        { memberships: { some: { patientId: patient.id } } },
      ],
    },
    include: {
      memberships: {
        where: { status: { not: "DETACHED" } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const locale = (await getLocaleCookie()) as Lang;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-neutral-900">
          {locale === "es" ? "Mi Familia" : "My Family"}
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          {locale === "es"
            ? "Administra los miembros de tu grupo familiar, invita a miembros y ve el estado de su diagnóstico."
            : "Manage your family group members, send invites, and view diagnosis status."}
        </p>
      </div>

      <FamilyPageContent
        initialFamily={
          family
            ? {
                id: family.id,
                name: family.name,
                primaryPatientId: family.primaryPatientId,
                memberships: family.memberships.map((m) => ({
                  id: m.id,
                  firstName: m.firstName,
                  lastName: m.lastName,
                  dateOfBirth: m.dateOfBirth?.toISOString() ?? null,
                  relationship: m.relationship,
                  ageTier: m.ageTier,
                  status: m.status,
                  hasBleedingDisorder: m.hasBleedingDisorder,
                  diagnosisVerified: m.diagnosisVerified,
                  patientId: m.patientId,
                  inviteEmail: m.inviteEmail,
                  inviteSentAt: m.inviteSentAt?.toISOString() ?? null,
                  boardApprovalId: m.boardApprovalId,
                  disorderCondition: m.disorderCondition,
                  disorderSeverity: m.disorderSeverity,
                })),
              }
            : null
        }
        patientId={patient.id}
      />
    </div>
  );
}
