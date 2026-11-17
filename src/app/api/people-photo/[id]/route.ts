import { NextRequest } from "next/server";
import { serveSanityImage } from "@/sanity/imageProxy";

export const dynamic = "force-dynamic";

/** Alias kept so old cached URLs keep working. New code uses /api/sanity-image/person/[id]. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return serveSanityImage(req, "person", params.id);
}
