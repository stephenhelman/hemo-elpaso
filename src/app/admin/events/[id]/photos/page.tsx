import { notFound, redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import EventPhotosClient from "./EventPhotosClient";

interface Props {
  params: { id: string };
}

export default async function EventPhotosPage({ params }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canManageEvents")) redirect("/admin/dashboard");

  const headersList = headers();
  const referer = headersList.get("referer") || "";
  const cameFromEvents =
    referer.includes("/admin/events") && !referer.includes("/admin/events/");

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      photos: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!event) notFound();

  return (
    <EventPhotosClient
      event={{ id: event.id, titleEn: event.titleEn }}
      photos={event.photos}
      adminEmail={admin.email}
      cameFromEvents={cameFromEvents}
    />
  );
}
