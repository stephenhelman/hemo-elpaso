import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { ArrowLeft, Images } from "lucide-react";
import Link from "next/link";
import PhotosManager from "@/components/admin/photos/PhotosManager";
import { headers } from "next/headers";

interface Props {
  params: { id: string };
}

export default async function EventPhotosPage({ params }: Props) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

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
      photos: {
        orderBy: {
          uploadedAt: "desc",
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
              Event Photos
            </h1>
            <p className="text-neutral-500 mb-2">{event.titleEn}</p>
            <p className="text-sm text-neutral-400">
              Upload photos for attendees to view in the live gallery
            </p>
          </div>

          {event.photos.length > 0 && (
            <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-semibold">
              {event.photos.length} photo{event.photos.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <PhotosManager
          eventId={event.id}
          photos={event.photos}
          adminEmail={admin.email}
        />
      </div>
    </div>
  );
}
