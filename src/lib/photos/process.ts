import sharp from "sharp";

export const FULL_WIDTH = 1920;
export const THUMB_WIDTH = 400;

export type ImageKind = "jpeg" | "png" | "webp";

/**
 * Identify an image by its first bytes (never by file name or the browser-supplied type).
 * HEIC/HEIF and GIF are deliberately not accepted: the bundled image library cannot decode HEVC, and animation is not wanted.
 */
export function sniffImage(buf: Buffer): ImageKind | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

export type Processed = { main: Buffer; thumb: Buffer; width: number; height: number };

/**
 * Original -> 1920px webp + 400px webp thumbnail.
 *  - `.rotate()` with no argument applies the EXIF orientation to the pixels, so the stored file is upright.
 *  - Metadata is NOT carried over (no withMetadata/keepExif/keepIccProfile): EXIF, GPS, XMP, IPTC, ICC and comments are gone.
 *    Colours are converted to sRGB first. The output is checked below and the function throws if any metadata survived.
 *  - Decoding is capped (pixel limit) so a decompression bomb fails instead of exhausting memory.
 * Throws if the bytes are not a decodable image.
 */
export async function processImage(original: Buffer): Promise<Processed> {
  const kind = sniffImage(original);
  if (!kind) throw new Error("Not a JPEG, PNG or WebP image");

  const { data: main, info } = await sharp(original, { limitInputPixels: 120_000_000, failOn: "error" })
    .rotate()
    .resize({ width: FULL_WIDTH, height: FULL_WIDTH, fit: "inside", withoutEnlargement: true })
    .toColorspace("srgb")
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const thumb = await sharp(main)
    .resize({ width: THUMB_WIDTH, height: THUMB_WIDTH, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 76 })
    .toBuffer();

  for (const [name, buf] of [["image", main], ["thumbnail", thumb]] as const) {
    const m = await sharp(buf).metadata();
    if (m.exif || m.icc || m.xmp || m.iptc || m.tifftagPhotoshop) throw new Error(`Metadata survived processing (${name})`);
  }
  return { main, thumb, width: info.width, height: info.height };
}
