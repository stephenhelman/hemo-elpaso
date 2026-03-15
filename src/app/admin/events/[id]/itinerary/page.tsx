import { notFound, redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import ItineraryList from "@/components/admin/itinerary/ItineraryList";
import CreateItineraryItemButton from "@/components/admin/itinerary/CreateItineraryItemButton";
import { headers } from "next/headers";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";

interface Props {
  params: { id: string };
}

export default async function EventItineraryPage({ params }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canManageEvents")) redirect("/admin/dashboard");

  const locale = (await getLocaleCookie()) as Lang;

  const headersList = headers();
  const referer = headersList.get("referer") || "";
  const cameFromEvents =
    referer.includes("/admin/events") && !referer.includes("/admin/events/");

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      itineraryItems: {
        orderBy: {
          sequenceOrder: "asc",
        },
      },
    },
  });

  if (!event) notFound();

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href={
            cameFromEvents ? "/admin/events" : `/admin/events/${event.id}/edit`
          }
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {cameFromEvents ? "Back to Events" : "Back to Event"}
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              Event Itinerary
            </h1>
            <p className="text-neutral-500 mb-2">{event.titleEn}</p>
            <p className="text-sm text-neutral-400">
              Manage the live schedule for attendees
            </p>
          </div>

          <CreateItineraryItemButton eventId={event.id} locale={locale} />
        </div>

        <ItineraryList
          eventId={event.id}
          items={event.itineraryItems}
          adminEmail={admin.email}
          locale={locale}
        />
      </div>
    </div>
  );
}
