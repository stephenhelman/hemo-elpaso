import { prisma } from "@/lib/db";
import { copyInR2, deleteManyFromR2, r2PublicUrl } from "@/lib/r2";
import { newPhotoKeys, type Visibility } from "./keys";

type PhotoRow = { id: string; eventId: string; key: string; thumbKey: string | null };

/**
 * Move a photo's objects to a fresh random key in the pending or public area and point the row at them.
 * Order is copy -> update row -> delete old, so a failure part-way never leaves the row pointing at nothing
 * (worst case: a stray object under a random, unlinked key).
 */
export async function moveToVisibility(photo: PhotoRow, target: Visibility) {
  const keys = newPhotoKeys(photo.eventId, target);
  await copyInR2(photo.key, keys.key);
  if (photo.thumbKey) await copyInR2(photo.thumbKey, keys.thumbKey);

  const updated = await prisma.eventPhoto.update({
    where: { id: photo.id },
    data: {
      key: keys.key,
      url: r2PublicUrl(keys.key),
      ...(photo.thumbKey ? { thumbKey: keys.thumbKey, thumbUrl: r2PublicUrl(keys.thumbKey) } : {}),
    },
  });
  await deleteManyFromR2([photo.key, photo.thumbKey ?? ""]);
  return updated;
}

/** Remove a photo's objects from R2 (both sizes). The row is deleted by the caller. */
export const deletePhotoObjects = (photo: { key: string; thumbKey: string | null }) =>
  deleteManyFromR2([photo.key, photo.thumbKey ?? ""]);
