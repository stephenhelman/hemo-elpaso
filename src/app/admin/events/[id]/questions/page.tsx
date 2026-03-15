import { notFound, redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import EventQuestionsClient from "./EventQuestionsClient";

interface Props {
  params: { id: string };
}

export default async function EventQuestionsPage({ params }: Props) {
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
      questions: {
        orderBy: [{ answered: "asc" }, { upvotes: "desc" }],
      },
    },
  });

  if (!event) notFound();

  return (
    <EventQuestionsClient
      event={{ id: event.id, titleEn: event.titleEn }}
      questions={event.questions}
      adminEmail={admin.email}
      locale={locale}
      cameFromEvents={cameFromEvents}
    />
  );
}
