import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/client";
import { personPhotoUrl, type SanityImageField } from "@/sanity/photoUrl";

export const dynamic = "force-dynamic";

/**
 * Serves a person's photo from the PRIVATE Sanity dataset.
 *
 * Browsers cannot fetch private-dataset asset URLs, so this route does it with the
 * server-only read token and re-serves the image from our own domain.
 * Allow-list: only the photo of an ACTIVE `person` document, only fixed square sizes,
 * and nothing else from Sanity is reachable through it. The `v` query parameter is only a
 * cache-buster for the CDN; it is not trusted.
 *
 * The square crop honours the crop rectangle and hotspot (focal point) chosen in the Studio:
 * the whole image object (asset, crop, hotspot) goes through the image-url builder.
 */
const SIZES = [128, 256, 400, 640];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(id)) return new NextResponse(null, { status: 404 });
  const requested = Number(req.nextUrl.searchParams.get("w"));
  const w = SIZES.includes(requested) ? requested : 256;

  try {
    const photo = await client.fetch<SanityImageField | null>(
      `*[_type == "person" && _id == $id && active == true][0].photo{ asset, crop, hotspot }`,
      { id },
      { next: { tags: ["person"], revalidate: 3600 } },
    );
    if (!photo?.asset?._ref) return new NextResponse(null, { status: 404 });

    const url = personPhotoUrl(photo, w);
    if (!/^https:\/\/cdn\.sanity\.io\//.test(url)) return new NextResponse(null, { status: 404 });

    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.SANITY_API_READ_TOKEN ?? ""}` },
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body) {
      console.error("[people-photo] upstream", upstream.status);
      return new NextResponse(null, { status: 404 });
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        // `v` changes whenever the photo is replaced, so a long cache is safe.
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    console.error("[people-photo] failed", (err as Error)?.message);
    return new NextResponse(null, { status: 404 });
  }
}
