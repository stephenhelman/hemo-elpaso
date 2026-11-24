import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { HOUSEHOLD_EVIDENCE } from "@/lib/patients/query";
import { isOrgIdentity } from "@/lib/identity/rules";
import { emailDomain } from "@/lib/site";
import BoardManagementClient from "./BoardManagementClient";

export default async function BoardManagementPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canAssignBoardRoles")) redirect("/admin/dashboard");

  const canAssign = admin.can("canAssignBoardRoles");

  const boardRoles = await prisma.boardRole.findMany({
    include: {
      patient: {
        include: { contactProfile: true, identities: { where: { patientId: { not: null } } } },
      },
    },
    orderBy: [{ active: "desc" }, { assignedAt: "desc" }],
  });
  // Records that carry household data are the President/VP's: the admin can see that, but gets no controls.
  const householdIds = new Set(
    (await prisma.patient.findMany({ where: { id: { in: boardRoles.map((r) => r.patientId) }, ...HOUSEHOLD_EVIDENCE }, select: { id: true } })).map((p) => p.id),
  );

  return (
    <BoardManagementClient
      boardRoles={boardRoles.map((r) => ({
        id: r.id,
        role: r.role,
        fromEmail: r.fromEmail,
        active: r.active,
        assignedBy: r.assignedBy,
        assignedAt: r.assignedAt.toISOString(),
        patient: {
          id: r.patient.id,
          linked: r.patient.identities.some((i) => i.linkedVia !== "unlinked"),
          orgIdentities: r.patient.identities.filter((i) => isOrgIdentity(i, emailDomain())).map((i) => ({ id: i.id, lastLoginAt: i.lastLoginAt.toISOString() })),
          hasHousehold: householdIds.has(r.patient.id),
          email: r.patient.email,
          firstName: r.patient.contactProfile?.firstName ?? null,
          lastName: r.patient.contactProfile?.lastName ?? null,
        },
      }))}
      canAssign={canAssign}
    />
  );
}
