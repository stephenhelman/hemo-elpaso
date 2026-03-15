import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import MinutesIndexClient from "./MinutesIndexClient";

export default async function AdminMinutesPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canManageMinutes")) redirect("/admin/dashboard");

  const minutes = await prisma.boardMinutes.findMany({
    orderBy: { meetingDate: "desc" },
  });

  const isSecretary = admin.can("canManageMinutes");

  return (
    <MinutesIndexClient
      minutes={minutes.map((m) => ({
        id: m.id,
        title: m.title,
        meetingDate: m.meetingDate.toISOString(),
        isPublic: m.isPublic,
        markedPublicAt: m.markedPublicAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
      }))}
      isSecretary={isSecretary}
    />
  );
}
