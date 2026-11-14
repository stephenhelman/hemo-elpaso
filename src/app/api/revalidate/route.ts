import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

export const dynamic = "force-dynamic";

/**
 * Sanity webhook target. The request signature is verified against
 * SANITY_REVALIDATE_SECRET; unsigned or mis-signed requests are rejected.
 * It touches no database: it only invalidates cached Sanity fetches by tag.
 * Webhook projection to configure in Sanity: {_type, _id}
 */
const TAGS_BY_TYPE: Record<string, string[]> = {
  siteSettings: ["siteSettings"],
  person: ["person"],
  scholarship: ["scholarship"],
  homePage: ["page:home"],
  aboutPage: ["page:about"],
  resourcesPage: ["page:resources"],
  getInvolvedPage: ["page:get-involved"],
  scholarshipsPage: ["page:scholarships"],
  contactPage: ["page:contact"],
};

export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    console.error("[revalidate] SANITY_REVALIDATE_SECRET is not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  try {
    const { isValidSignature, body } = await parseBody<{ _type?: string }>(req, secret);
    if (!isValidSignature) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

    const tags = (body?._type && TAGS_BY_TYPE[body._type]) || [];
    if (tags.length === 0) return NextResponse.json({ revalidated: [], note: "no tags for type" });
    tags.forEach((t) => revalidateTag(t));
    return NextResponse.json({ revalidated: tags });
  } catch (err) {
    console.error("[revalidate] failed", (err as Error)?.message);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
