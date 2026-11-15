import { NextRequest } from "next/server";
import { serveSanityImage } from "@/sanity/imageProxy";

export const dynamic = "force-dynamic";

/** /api/sanity-image/person/[id] and /api/sanity-image/sponsor/[id]. See src/sanity/imageProxy.ts. */
export async function GET(req: NextRequest, { params }: { params: { kind: string; id: string } }) {
  return serveSanityImage(req, params.kind, params.id);
}
