import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import FamilyApprovalsClient from "@/components/admin/FamilyApprovalsClient";

export default async function FamilyApprovalsPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canManageUsers")) redirect("/admin/dashboard");

  const approvals = await prisma.boardApproval.findMany({
    where: { type: "FAMILY_DETACHMENT", status: "PENDING" },
    orderBy: { requestedAt: "asc" },
  });

  const enriched = await Promise.all(
    approvals.map(async (a) => {
      const membership = a.resourceId
        ? await prisma.familyMembership.findUnique({
            where: { id: a.resourceId },
            include: {
              family: {
                include: {
                  primaryPatient: { include: { contactProfile: true } },
                },
              },
            },
          })
        : null;

      return {
        id: a.id,
        type: a.type,
        status: a.status,
        requestedBy: a.requestedBy,
        requestedAt: a.requestedAt.toISOString(),
        notes: a.notes,
        membership: membership
          ? {
              id: membership.id,
              firstName: membership.firstName,
              lastName: membership.lastName,
              relationship: membership.relationship,
              ageTier: membership.ageTier,
              family: {
                name: membership.family.name,
                primaryPatient: {
                  email: membership.family.primaryPatient.email,
                  contactProfile: membership.family.primaryPatient.contactProfile
                    ? {
                        firstName: membership.family.primaryPatient.contactProfile.firstName,
                        lastName: membership.family.primaryPatient.contactProfile.lastName,
                      }
                    : null,
                },
              },
            }
          : null,
      };
    })
  );

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-neutral-900">
          Family Detachment Requests
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          Pending board approval for permanent family detachments.
        </p>
      </div>
      <FamilyApprovalsClient approvals={enriched} />
    </div>
  );
}
