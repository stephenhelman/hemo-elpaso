import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import EventQuestionsClient from "./EventQuestionsClient";

interface Props {
  params: { id: string };
}

export default async function EventQuestionsPage({ params }: Props) {
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
