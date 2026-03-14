import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import EventPollsClient from "./EventPollsClient";

interface Props {
  params: { id: string };
}

export default async function EventPollsPage({ params }: Props) {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

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
