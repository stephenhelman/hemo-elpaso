import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const events = await prisma.event.findMany({
    where: { recapPublishedAt: { not: null } },
    select: { slug: true },
  });
  return events.map((e) => ({ slug: e.slug }));
}

export default async function EventRecapPublicPage({ params }: Props) {
  const locale = (await getLocaleCookie()) as Lang;

  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    select: {
      slug: true,
      titleEn: true,
      titleEs: true,
      eventDate: true,
      location: true,
      recapTitleEn: true,
      recapTitleEs: true,
      recapBodyEn: true,
      recapBodyEs: true,
      recapGalleryEmbedUrl: true,
      recapPublishedAt: true,
    },
  });

  if (!event || !event.recapPublishedAt) notFound();

  const title = locale === "es" ? (event.recapTitleEs ?? event.recapTitleEn) : event.recapTitleEn;
  const body = locale === "es" ? (event.recapBodyEs ?? event.recapBodyEn) : event.recapBodyEn;
  const eventTitle = locale === "es" ? event.titleEs : event.titleEn;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back */}
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === "es" ? "Volver al evento" : "Back to event"}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="text-primary font-semibold text-sm uppercase tracking-wide mb-2">
            {locale === "es" ? "Resumen del Evento" : "Event Recap"}
          </p>
          <h1 className="text-4xl font-display font-bold text-neutral-900 mb-4 leading-tight">
            {title ?? eventTitle}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(event.eventDate).toLocaleDateString(
                locale === "es" ? "es-MX" : "en-US",
                { weekday: "long", month: "long", day: "numeric", year: "numeric" },
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {event.location}
            </span>
          </div>
        </div>

        {/* Body */}
        {body && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 mb-8">
            <div className="prose prose-neutral max-w-none">
              {body.split("\n").map((para, i) =>
                para.trim() ? (
                  <p key={i} className="text-neutral-700 leading-relaxed mb-4 last:mb-0">
                    {para}
                  </p>
                ) : (
                  <br key={i} />
                ),
              )}
            </div>
          </div>
        )}

        {/* Photo gallery embed */}
        {event.recapGalleryEmbedUrl && (
          <div className="mb-8">
            <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">
              {locale === "es" ? "Galería de Fotos" : "Photo Gallery"}
            </h2>
            <div className="rounded-2xl overflow-hidden border border-neutral-200 aspect-video">
              <iframe
                src={event.recapGalleryEmbedUrl}
                className="w-full h-full"
                allowFullScreen
                title={locale === "es" ? "Galería de fotos" : "Photo gallery"}
              />
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <Link
            href={`/events/${event.slug}`}
            className="text-sm text-primary hover:underline"
          >
            {locale === "es" ? "← Volver al evento" : "← Back to event"}
          </Link>
          <Link href="/events" className="text-sm text-neutral-500 hover:text-neutral-700 hover:underline">
            {locale === "es" ? "Ver todos los eventos" : "All events"}
          </Link>
        </div>
      </div>
    </div>
  );
}
