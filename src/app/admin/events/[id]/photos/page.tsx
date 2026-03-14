import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import EventPhotosClient from "./EventPhotosClient";

interface Props {
  params: { id: string };
}

export default async function EventPhotosPage({ params }: Props) {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

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
