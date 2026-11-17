import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { client } from "./client";
import { personPhotoUrl, sponsorLogoUrl, type SanityImageField } from "./photoUrl";

/**
 * Serves images from the PRIVATE Sanity dataset.
 *
 * Browsers cannot fetch private-dataset asset URLs, so the route does it with the server-only read token and
 * re-serves the image from our own domain. Allow-list, per kind:
 *   person  -> the `photo` of an ACTIVE person document, square crop, fixed sizes
 *   sponsor -> the `logo` of an ACTIVE sponsor document, aspect ratio kept, fixed widths
 * Nothing else from Sanity is reachable through it. The `v` query parameter is only a cache-buster for the CDN;
 * it is not trusted. Crop and hotspot from the Studio are honoured: the whole image object goes to the builder.
 */
export const IMAGE_KINDS = {
  person: {
    type: "person",
    field: "photo",
    sizes: [128, 256, 400, 640],
    fallback: 256,
    url: personPhotoUrl,
  },
  sponsor: {
    type: "sponsor",
    field: "logo",
    sizes: [160, 320, 640],
    fallback: 320,
    url: sponsorLogoUrl,
  },
} as const;

export type ImageKind = keyof typeof IMAGE_KINDS;

export async function serveSanityImage(req: NextRequest, kind: string, id: string): Promise<NextResponse> {
  const cfg = (IMAGE_KINDS as Record<string, (typeof IMAGE_KINDS)[ImageKind]>)[kind];
  if (!cfg || !Object.prototype.hasOwnProperty.call(IMAGE_KINDS, kind)) return new NextResponse(null, { status: 404 });
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(id)) return new NextResponse(null, { status: 404 });

  const requested = Number(req.nextUrl.searchParams.get("w"));
  const w = (cfg.sizes as readonly number[]).includes(requested) ? requested : cfg.fallback;

  try {
    // type and field come from the allow-list above, never from the request.
    const image = await client.fetch<SanityImageField | null>(
      `*[_type == $type && _id == $id && active == true][0]{ "img": ${cfg.field}{ asset, crop, hotspot } }.img`,
      { type: cfg.type, id },
      { next: { tags: [cfg.type], revalidate: 3600 } },
    );
    if (!image?.asset?._ref) return new NextResponse(null, { status: 404 });

    const url = cfg.url(image, w);
    if (!/^https:\/\/cdn\.sanity\.io\//.test(url)) return new NextResponse(null, { status: 404 });

    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.SANITY_API_READ_TOKEN ?? ""}` },
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body) {
      console.error("[sanity-image] upstream", kind, upstream.status);
      return new NextResponse(null, { status: 404 });
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        // `v` changes whenever the image is replaced, so a long cache is safe.
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    console.error("[sanity-image] failed", kind, (err as Error)?.message);
    return new NextResponse(null, { status: 404 });
  }
}
