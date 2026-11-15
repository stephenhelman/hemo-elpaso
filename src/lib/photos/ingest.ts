import { prisma } from "@/lib/db";
import { deleteManyFromR2, getR2Buffer, headR2, r2PublicUrl, uploadToR2 } from "@/lib/r2";
import { MAX_UPLOAD_BYTES, newPhotoKeys } from "./keys";
import { processImage } from "./process";

export type IngestResult =
  | { ok: true; photo: Awaited<ReturnType<typeof prisma.eventPhoto.create>> }
  | { ok: false; status: number; error: string };

/**
 * Turn one browser-uploaded original (uploads/tmp/...) into an UNAPPROVED gallery photo:
 * validate the bytes, auto-rotate, strip all metadata, write 1920px + 400px webp into the pending area, insert the row.
 * The original is deleted on every path, success or failure.
 */
export async function ingestTmpUpload(eventId: string, tmpKey: string, uploadedBy: string): Promise<IngestResult> {
  try {
    const head = await headR2(tmpKey);
    if (!head) return { ok: false, status: 404, error: "The upload did not arrive. Try again." };
    if (head.size > MAX_UPLOAD_BYTES) return { ok: false, status: 413, error: "Larger than 25 MB" };

    let processed;
    try {
      processed = await processImage(await getR2Buffer(tmpKey));
    } catch (err) {
      console.error("[photos] processing failed", (err as Error)?.message);
      return { ok: false, status: 422, error: "That file is not a valid JPEG, PNG or WebP image." };
    }

    const keys = newPhotoKeys(eventId, "pending");
    await uploadToR2(processed.main, keys.key, "image/webp");
    await uploadToR2(processed.thumb, keys.thumbKey, "image/webp");

    const last = await prisma.eventPhoto.aggregate({ where: { eventId }, _max: { sortOrder: true } });
    const photo = await prisma.eventPhoto.create({
      data: {
        eventId,
        url: r2PublicUrl(keys.key),
        key: keys.key,
        thumbUrl: r2PublicUrl(keys.thumbKey),
        thumbKey: keys.thumbKey,
        width: processed.width,
        height: processed.height,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
        approved: false,
        uploadedBy,
      },
    });
    return { ok: true, photo };
  } catch (err) {
    console.error("[photos] ingest error", (err as Error)?.message);
    return { ok: false, status: 500, error: "Processing failed. Try again." };
  } finally {
    // The original carries the camera's metadata (including GPS): it never outlives this request.
    await deleteManyFromR2([tmpKey]).catch((e) => console.error("[photos] tmp delete failed", (e as Error)?.message));
  }
}
