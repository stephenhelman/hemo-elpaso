import { notFound, redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import MinutesDetailClient from "./MinutesDetailClient";

interface Props {
  params: { id: string };
}

export default async function AdminMinutesDetailPage({ params }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canManageMinutes")) redirect("/admin/dashboard");

  const minutes = await prisma.boardMinutes.findUnique({
    where: { id: params.id },
  });

  if (!minutes) notFound();

  const isSecretary = admin.can("canManageMinutes");

  return (
    <MinutesDetailClient
      minutes={{
        id: minutes.id,
        title: minutes.title,
        meetingDate: minutes.meetingDate.toISOString(),
        content: minutes.content as any,
        isPublic: minutes.isPublic,
        markedPublicBy: minutes.markedPublicBy,
        markedPublicAt: minutes.markedPublicAt?.toISOString() ?? null,
        uploadedBy: minutes.uploadedBy,
        createdAt: minutes.createdAt.toISOString(),
      }}
      isSecretary={isSecretary}
    />
  );
}
