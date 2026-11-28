import { notFound, redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { noMediaConsentCount } from "@/lib/photos/consent";
import { adminPhoto } from "@/lib/photos/admin-view";
import EventPhotosClient from "./EventPhotosClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function EventPhotosPage({ params }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageEvents")) redirect("/admin/dashboard");

  const headersList = headers();
  const referer = headersList.get("referer") || "";
  const cameFromEvents =
    referer.includes("/admin/events") && !referer.includes("/admin/events/");

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      photos: { orderBy: [{ sortOrder: "asc" }, { uploadedAt: "asc" }] },
    },
  });

  if (!event) notFound();
  const consent = await noMediaConsentCount(event.id);

  return (
    <EventPhotosClient
      event={{ id: event.id, titleEn: event.titleEn, coverPhotoId: event.coverPhotoId }}
      photos={event.photos.map(adminPhoto)}
      noPhotosFamilies={consent.noPhotos}
      totalFamilies={consent.families}
      cameFromEvents={cameFromEvents}
    />
  );
}
