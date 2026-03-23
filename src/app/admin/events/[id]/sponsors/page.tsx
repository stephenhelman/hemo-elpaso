import { notFound, redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EventSponsorsClient from "./EventSponsorsClient";

interface Props {
  params: { id: string };
}

export default async function EventSponsorsPage({ params }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canManageEvents")) redirect("/admin/dashboard");

  const [event, allSponsors] = await Promise.all([
    prisma.event.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        titleEn: true,
        sponsors: { select: { sponsorId: true } },
      },
    }),
    prisma.sponsor.findMany({
      where: { isActive: true },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!event) notFound();

  const selectedIds = event.sponsors.map((es) => es.sponsorId);

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <Link
        href={`/admin/events/${event.id}/edit`}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Event
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-1">Event Sponsors</h1>
        <p className="text-neutral-500">{event.titleEn}</p>
      </div>

      <EventSponsorsClient
        eventId={event.id}
        allSponsors={allSponsors}
        initialSelectedIds={selectedIds}
      />
    </div>
  );
}
