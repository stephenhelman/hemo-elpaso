import { notFound, redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EventRecapForm from "./EventRecapForm";

interface Props {
  params: { id: string };
}

export default async function EventRecapPage({ params }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/portal/dashboard");
  if (!admin.can("canManageEvents")) redirect("/admin/dashboard");

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      slug: true,
      titleEn: true,
      titleEs: true,
      eventDate: true,
      recapTitleEn: true,
      recapTitleEs: true,
      recapBodyEn: true,
      recapBodyEs: true,
      recapGalleryEmbedUrl: true,
      recapPublishedAt: true,
    },
  });

  if (!event) notFound();

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <Link
        href={`/admin/events/${event.id}/edit`}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Event
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-1">
          Event Recap
        </h1>
        <p className="text-neutral-500">
          {event.titleEn} — {new Date(event.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <EventRecapForm event={event} />
    </div>
  );
}
