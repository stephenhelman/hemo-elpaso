import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { presignPut } from "@/lib/r2";
import { ALLOWED_UPLOAD_TYPES, MAX_FILES_PER_BATCH, MAX_UPLOAD_BYTES, newTmpKey } from "@/lib/photos/keys";

export const dynamic = "force-dynamic";

/**
 * Step 1 of an upload: hand out short-lived presigned PUT URLs into the PRIVATE uploads/tmp/ area.
 * The browser sends each original straight to R2 (no file passes through this server); step 2 (./process) validates
 * the real bytes, strips metadata, writes the public-format files and deletes the original.
 * The type and exact size are part of the signature, and the size is re-checked from R2 in step 2.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission("canManageEvents");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const files: { name?: unknown; size?: unknown; type?: unknown }[] = Array.isArray(body?.files) ? body.files : [];
  if (files.length === 0) return NextResponse.json({ error: "No files" }, { status: 400 });
  if (files.length > MAX_FILES_PER_BATCH) {
    return NextResponse.json({ error: `At most ${MAX_FILES_PER_BATCH} photos at a time` }, { status: 400 });
  }
  const event = await prisma.event.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const uploads = await Promise.all(
    files.map(async (f) => {
      const size = Number(f.size);
      const type = typeof f.type === "string" ? f.type.toLowerCase() : "";
      if (!Number.isInteger(size) || size <= 0) return { error: "Empty or invalid file" };
      if (size > MAX_UPLOAD_BYTES) return { error: "Larger than 25 MB" };
      if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(type)) return { error: "Only JPEG, PNG or WebP images" };
      const key = newTmpKey(params.id);
      const url = await presignPut(key, type, size, 300);
      return { key, url, headers: { "Content-Type": type } };
    }),
  );
  return NextResponse.json({ uploads });
}
