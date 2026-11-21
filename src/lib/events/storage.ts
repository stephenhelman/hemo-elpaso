import { deleteR2Prefix } from "@/lib/r2";

/** Every R2 folder an event can own (see lib/photos/keys.ts and the flyers route). */
export const eventStoragePrefixes = (eventId: string) => [
  `photos/${eventId}/`, // approved, public
  `photos-pending/${eventId}/`, // processed, not approved
  `uploads/tmp/${eventId}/`, // browser upload targets that were never processed
  `flyers/${eventId}/`,
];

/**
 * Delete all of an event's stored files. Never throws: each failure is logged (event id and prefix only, no
 * filenames) and returned so the caller can record it. Safe to re-run.
 */
export async function deleteEventStorage(eventId: string): Promise<{ deleted: number; failed: string[] }> {
  let deleted = 0;
  const failed: string[] = [];
  for (const prefix of eventStoragePrefixes(eventId)) {
    try {
      deleted += await deleteR2Prefix(prefix);
    } catch (e) {
      failed.push(prefix.split("/")[0]);
      console.error("[events] storage cleanup failed", { eventId, prefix: prefix.split("/")[0], error: (e as Error)?.name });
    }
  }
  return { deleted, failed };
}
