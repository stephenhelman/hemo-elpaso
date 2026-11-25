import { notFound, redirect } from "next/navigation";
import { getLocaleCookie } from "@/lib/locale";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/features";
import EventEditForm from "@/components/admin/EventEditForm";
import type { Lang } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getActiveSponsorOptions } from "@/sanity/sponsors";
import EventQuickActions from "@/components/admin/EventQuickActions";

interface Props {
  params: { id: string };
}

export default async function EditEventPage({ params }: Props) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageEvents")) redirect("/admin/dashboard");
  const locale = (await getLocaleCookie()) as Lang;

  // Get event with targeting
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      targeting: true,
    },
  });

  if (!event) notFound();
  const sponsorOptions = await getActiveSponsorOptions();

  return (
    <div className="p-4 md:p-8">
      <div className=" mb-8">
        <div className="mb-8">
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Edit Event
          </h1>
          <p className="text-neutral-500">
            Update event details and targeting preferences
          </p>
        </div>

        <EventQuickActions eventId={event.id} />
      </div>

      <EventEditForm event={event} locale={locale} sponsorOptions={sponsorOptions} recordingsOn={await isFeatureEnabled("recordings")} />
    </div>
  );
}
