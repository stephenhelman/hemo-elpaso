import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import EventsDisplay from "@/components/admin/EventDisplay";
import { Lang } from "@/types";
import { adminEventsTranslation } from "@/translation/adminPages";
import { getLocaleCookie } from "@/lib/locale";

export default async function AdminEventsPage() {
  const locale = (await getLocaleCookie()) as Lang;
  const t = adminEventsTranslation[locale];

  const events = await prisma.event.findMany({
    orderBy: {
      eventDate: "desc",
    },
    include: {
      _count: {
        select: { rsvps: true },
      },
    },
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            {t.heading}
          </h1>
          <p className="text-neutral-500">{t.subtitle}</p>
        </div>
        <Link
          href="/admin/events/new"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {t.createEvent}
        </Link>
      </div>

      <EventsDisplay events={events} locale={locale} />
    </div>
  );
}
