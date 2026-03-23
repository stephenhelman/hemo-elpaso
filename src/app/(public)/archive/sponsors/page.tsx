import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import type { Lang } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Building2, Globe } from "lucide-react";

const TIER_ORDER = ["PLATINUM", "GOLD", "SILVER", "BRONZE", "PARTNER"];
const TIER_LABELS: Record<string, { en: string; es: string }> = {
  PLATINUM: { en: "Platinum", es: "Platino" },
  GOLD: { en: "Gold", es: "Oro" },
  SILVER: { en: "Silver", es: "Plata" },
  BRONZE: { en: "Bronze", es: "Bronce" },
  PARTNER: { en: "Community Partner", es: "Socio Comunitario" },
};

export default async function ArchiveSponsorsPage() {
  const locale = (await getLocaleCookie()) as Lang;
  const isEs = locale === "es";

  const sponsors = await prisma.sponsor.findMany({
    where: { isActive: true },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    include: {
      events: {
        include: {
          event: { select: { id: true, titleEn: true, titleEs: true, eventDate: true } },
        },
        orderBy: { event: { eventDate: "desc" } },
      },
    },
  });

  const grouped = TIER_ORDER.reduce<Record<string, typeof sponsors>>((acc, tier) => {
    const list = sponsors.filter((s) => s.tier === tier);
    if (list.length) acc[tier] = list;
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link
        href="/archive"
        className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors mb-8 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        {isEs ? "Volver al Archivo" : "Back to Archive"}
      </Link>

      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold text-neutral-900 mb-3">
          {isEs ? "Nuestros Patrocinadores" : "Our Sponsors"}
        </h1>
        <p className="text-neutral-500 text-lg">
          {isEs
            ? "Gracias a las organizaciones que apoyan nuestra misión."
            : "Thank you to the organizations that support our mission."}
        </p>
      </div>

      {sponsors.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{isEs ? "No hay patrocinadores aún." : "No sponsors yet."}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([tier, list]) => (
            <section key={tier}>
              <h2 className="font-display font-bold text-neutral-900 text-2xl mb-5 border-b border-neutral-200 pb-3">
                {TIER_LABELS[tier]?.[locale] ?? tier}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {list.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl border border-neutral-200 p-6 flex items-start gap-4"
                  >
                    <div className="w-16 h-16 rounded-xl border border-neutral-100 bg-neutral-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {s.logoUrl ? (
                        <Image src={s.logoUrl} alt={s.name} width={64} height={64} className="object-contain" />
                      ) : (
                        <Building2 className="w-7 h-7 text-neutral-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900 text-lg mb-1">{s.name}</p>
                      {s.website && (
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-2"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          {s.website.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                      {s.events.length > 0 && (
                        <p className="text-xs text-neutral-400">
                          {isEs
                            ? `Patrocinó ${s.events.length} evento(s)`
                            : `Sponsored ${s.events.length} event(s)`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
