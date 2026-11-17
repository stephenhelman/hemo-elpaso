import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { isTmpKeyFor } from "@/lib/photos/keys";
import { ingestTmpUpload } from "@/lib/photos/ingest";
import { AuditAction } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Step 2 of an upload: process one original that the browser has put in uploads/tmp/ (see ./presign).
 * Validates the bytes (not the extension), auto-rotates, strips ALL metadata (EXIF, GPS, XMP, IPTC, ICC), writes a
 * 1920px and a 400px webp into the pending (unapproved) area, creates the EventPhoto row as UNAPPROVED and deletes the
 * original. The work is in src/lib/photos/ingest.ts.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const tmpKey = typeof body?.key === "string" ? body.key : "";
  if (!isTmpKeyFor(params.id, tmpKey)) return NextResponse.json({ error: "Invalid upload key" }, { status: 400 });

  const result = await ingestTmpUpload(params.id, tmpKey, admin!.email);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.EVENT_PHOTOS_UPLOADED,
      resourceType: "EventPhoto",
      resourceId: result.photo.id,
      details: "Uploaded 1 photo (unapproved)",
    },
  });
  return NextResponse.json({ photo: result.photo });
}
