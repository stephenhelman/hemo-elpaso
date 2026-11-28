import { presignGet } from "@/lib/r2";

/** Long enough to load an image, short enough that a copied address is soon useless. */
export const ADMIN_IMAGE_TTL_SECONDS = 120;

/**
 * How a board member's browser reads a photo that isn't approved: a presigned address on the storage API. Used by the
 * admin image route and by scripts/check-photo-pipeline.ts, so the check exercises the live path.
 */
export const adminImageUrl = (key: string): Promise<string> => presignGet(key, ADMIN_IMAGE_TTL_SECONDS);
