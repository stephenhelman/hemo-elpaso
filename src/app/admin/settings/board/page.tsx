import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import BoardManagementClient from "./BoardManagementClient";

export default async function BoardManagementPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canAssignBoardRoles")) redirect("/admin/dashboard");

  const canAssign = admin.can("canAssignBoardRoles");

  const boardRoles = await prisma.boardRole.findMany({
    include: {
      patient: {
        include: { contactProfile: true },
      },
    },
    orderBy: [{ active: "desc" }, { assignedAt: "desc" }],
  });

  return (
    <BoardManagementClient
      boardRoles={boardRoles.map((r) => ({
        id: r.id,
        role: r.role,
        fromEmail: r.fromEmail,
        active: r.active,
        assignedBy: r.assignedBy,
        assignedAt: r.assignedAt.toISOString(),
        gmailSendAsConfigured: r.gmailSendAsConfigured,
        patient: {
          id: r.patient.id,
          email: r.patient.email,
          firstName: r.patient.contactProfile?.firstName ?? null,
          lastName: r.patient.contactProfile?.lastName ?? null,
        },
      }))}
      canAssign={canAssign}
    />
  );
}
