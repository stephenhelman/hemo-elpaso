import { randomUUID } from "crypto";

/**
 * R2 key layout for event photos.
 *
 *   uploads/tmp/<eventId>/<uuid>          browser upload target; the original (with its EXIF/GPS). Deleted after processing.
 *   uploads/tmp/<eventId>/flyer-<uuid>    browser upload target for a flyer (lib/flyers/upload.ts). Deleted after saving.
 *   photos-pending/<eventId>/<uuid>.webp  processed, NOT approved. Never linked from a public page.
 *   photos/<eventId>/<uuid>.webp          processed and approved. These are the only keys public pages use.
 *
 * Every key contains a random UUID, so none of them can be guessed from the event, a filename or a timestamp.
 * Approving moves the objects to a NEW random key under photos/; unapproving moves them back to a new key under
 * photos-pending/. A URL that was public once therefore stops working when the photo is pulled.
 */
export const TMP_PREFIX = "uploads/tmp/";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_FILES_PER_BATCH = 40;
export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export const newTmpKey = (eventId: string) => `${TMP_PREFIX}${eventId}/${randomUUID()}`;

/** True only for a tmp key this server issued for this event (shape check; the object must also exist). */
export const isTmpKeyFor = (eventId: string, key: string) =>
  key.startsWith(`${TMP_PREFIX}${eventId}/`) && new RegExp(`^${TMP_PREFIX.replace(/\//g, "\\/")}[A-Za-z0-9-]+\\/${UUID}$`).test(key);

export type Visibility = "pending" | "public";
const prefixOf = (v: Visibility) => (v === "public" ? "photos" : "photos-pending");

export function newPhotoKeys(eventId: string, visibility: Visibility) {
  const id = randomUUID();
  return { key: `${prefixOf(visibility)}/${eventId}/${id}.webp`, thumbKey: `${prefixOf(visibility)}/${eventId}/${id}-t.webp` };
}

export const isPendingKey = (key: string) => key.startsWith("photos-pending/");
