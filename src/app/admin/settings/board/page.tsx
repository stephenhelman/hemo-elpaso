import { redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import BoardManagementClient from "./BoardManagementClient";

export default async function BoardManagementPage() {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: { boardRoles: true },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

  const canAssign =
    admin.role === "admin" ||
    admin.boardRoles.some(
      (r) => r.active && ["PRESIDENT", "VICE_PRESIDENT"].includes(r.role),
    );

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
