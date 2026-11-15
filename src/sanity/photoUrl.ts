import imageUrlBuilder from "@sanity/image-url";
import { projectId, dataset } from "./env";

const builder = imageUrlBuilder({ projectId, dataset });

/** The image field as stored: the asset reference plus the Studio's crop and hotspot. */
export type SanityImageField = {
  asset?: { _ref?: string } | null;
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  hotspot?: { x: number; y: number; height?: number; width?: number } | null;
};

/**
 * Square image URL honouring the crop rectangle and focal point (hotspot) set in the Studio.
 * The builder reads `crop` and `hotspot` off the image object, so pass the WHOLE object, not just the asset.
 * `fit("crop")` with both width and height is what makes the hotspot count.
 */
export function personPhotoUrl(photo: SanityImageField, size: number): string {
  return builder.image(photo as any).width(size).height(size).fit("crop").auto("format").quality(80).url();
}
