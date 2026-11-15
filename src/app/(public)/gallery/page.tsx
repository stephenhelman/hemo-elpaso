import Link from "next/link";
import type { Metadata } from "next";
import { Camera, Calendar } from "lucide-react";
import { getLocaleCookie } from "@/lib/locale";
import { getGalleryEvents } from "@/lib/photos/public";
import type { Lang } from "@/types";

// Per request: approvals and uploads happen without a deploy, and the language comes from a cookie.
export const dynamic = "force-dynamic";

const T = {
  en: {
    title: "Photos",
    subtitle: "Moments from our community events.",
    empty: "Photos from past events will appear here.",
    emptySub: "Check back after our next event.",
    photo: "photo",
    photos: "photos",
    meta: "Photos from HOEP community events in El Paso.",
  },
  es: {
    title: "Fotos",
    subtitle: "Momentos de los eventos de nuestra comunidad.",
    empty: "Las fotos de eventos pasados aparecerán aquí.",
    emptySub: "Vuelve después de nuestro próximo evento.",
    photo: "foto",
    photos: "fotos",
    meta: "Fotos de los eventos comunitarios de HOEP en El Paso.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const t = T[(await getLocaleCookie()) as Lang] ?? T.en;
  return { title: t.title, description: t.meta, alternates: { canonical: "/gallery" } };
}

export default async function GalleryPage() {
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  const t = T[locale];
  const events = await getGalleryEvents();

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">{t.title}</h1>
            <p className="text-xl text-neutral-300">{t.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center max-w-2xl mx-auto">
            <Camera className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-neutral-900 mb-2">{t.empty}</h2>
            <p className="text-neutral-500">{t.emptySub}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e) => {
              const title = locale === "es" ? e.titleEs : e.titleEn;
              const date = e.eventDate.toLocaleDateString(locale === "es" ? "es-MX" : "en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Denver" });
              return (
                <li key={e.id}>
                  <Link href={`/events/${e.slug}/recap`} className="group block bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                    <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={e.coverUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <div className="p-5">
                      <h2 className="font-display font-bold text-neutral-900 text-lg mb-2 group-hover:text-primary transition-colors">{title}</h2>
                      <div className="flex items-center justify-between text-sm text-neutral-500">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{date}</span>
                        <span className="flex items-center gap-1.5"><Camera className="w-4 h-4" />{e.photoCount} {e.photoCount === 1 ? t.photo : t.photos}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
