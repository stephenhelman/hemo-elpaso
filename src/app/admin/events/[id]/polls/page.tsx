import { notFound, redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import EventPollsClient from "./EventPollsClient";

interface Props {
  params: { id: string };
}

export default async function EventPollsPage({ params }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canViewEventStats")) redirect("/admin/dashboard");

  const locale = (await getLocaleCookie()) as Lang;

  const headersList = headers();
  const referer = headersList.get("referer") || "";
  const cameFromEvents =
    referer.includes("/admin/events") && !referer.includes("/admin/events/");

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      polls: {
        include: { options: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!event) notFound();

  return (
    <EventPollsClient
      event={{ id: event.id, titleEn: event.titleEn }}
      polls={event.polls}
      adminEmail={admin.email}
      locale={locale}
      cameFromEvents={cameFromEvents}
    />
  );
}
