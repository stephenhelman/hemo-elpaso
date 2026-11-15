"use client";

import { useState } from "react";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import type { SponsorData } from "@/sanity/types";

/** Only https links are ever rendered, whatever the dataset holds. */
export const safeWebsite = (u?: string | null) => (u && /^https:\/\/[^\s]+$/i.test(u) ? u : null);

/**
 * One sponsor logo (served by /api/sanity-image/sponsor, because the dataset is private), on a white chip so it
 * reads on dark backgrounds too. Falls back to the sponsor's name if the image is missing or fails to load.
 * With a website the logo is a link that opens in a new tab with noopener.
 */
export default function SponsorLogo({
  sponsor,
  locale,
  height = 56,
  showName = false,
  width = 320,
}: {
  sponsor: SponsorData;
  locale: Lang;
  height?: number;
  showName?: boolean;
  width?: 160 | 320 | 640;
}) {
  const [failed, setFailed] = useState(false);
  const v = sponsor.logo?.v;
  const showImg = !!v && !failed;
  const href = safeWebsite(sponsor.website);
  const alt = pick(sponsor.logo?.alt, locale) ?? sponsor.name;

  const inner = (
    <>
      <span className="flex items-center justify-center overflow-hidden rounded-xl bg-white px-4 py-3 border border-neutral-100" style={{ minHeight: height + 24 }}>
        {showImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/sanity-image/sponsor/${encodeURIComponent(sponsor._id)}?w=${width}&v=${encodeURIComponent(v!)}`}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            style={{ height, maxWidth: "min(220px, 100%)" }}
            className="w-auto object-contain"
          />
        ) : (
          <span className="font-semibold text-neutral-700 text-sm text-center px-2">{sponsor.name}</span>
        )}
      </span>
      {showName && <span className="block mt-2 text-sm font-medium text-neutral-700 text-center">{sponsor.name}</span>}
    </>
  );

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block group transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-xl" aria-label={showImg && !showName ? `${sponsor.name} (${locale === "es" ? "se abre en una pestaña nueva" : "opens in a new tab"})` : undefined}>
      {inner}
    </a>
  ) : (
    <div>{inner}</div>
  );
}
