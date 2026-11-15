import type { Lang } from "@/types";
import type { SponsorData } from "@/sanity/types";
import SponsorLogo from "./SponsorLogo";

/** "Sponsored by" row for an event page. Renders nothing when there are no (active) sponsors. */
export default function SponsoredBy({ sponsors, locale }: { sponsors: SponsorData[]; locale: Lang }) {
  if (sponsors.length === 0) return null;
  return (
    <section aria-labelledby="sponsored-by" className="bg-neutral-50 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8">
          <h2 id="sponsored-by" className="font-display text-lg font-bold text-neutral-900 text-center mb-6">
            {locale === "es" ? "Patrocinado por" : "Sponsored by"}
          </h2>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
            {sponsors.map((s) => (
              <li key={s._id}>
                <SponsorLogo sponsor={s} locale={locale} height={52} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
