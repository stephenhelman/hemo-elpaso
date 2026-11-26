import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { r2Config } from "./r2-config";

// Bucket, endpoint, credentials and public URL come from r2-config.ts and nowhere else. Clients are built on first use,
// so importing this module (e.g. during `next build`) needs no settings; the server checks them when it starts.
const connection = () => {
  const { endpoint, accessKeyId, secretAccessKey } = r2Config();
  return { region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } };
};

let client: S3Client | undefined;
export const r2Client = (): S3Client => (client ??= new S3Client(connection()));

const bucket = (): string => r2Config().bucket;

// Upload any file (PDF, images, etc)
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await r2Client().send(command);

  return r2PublicUrl(key);
}

// Upload and optimize image
export async function uploadImageToR2(
  file: Buffer,
  key: string,
  maxWidth: number = 1920,
): Promise<string> {
  // Optimize image with Sharp
  const optimized = await sharp(file)
    .resize(maxWidth, null, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();

  const webpKey = key.replace(/\.(jpg|jpeg|png)$/i, ".webp");

  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: webpKey,
    Body: optimized,
    ContentType: "image/webp",
  });

  await r2Client().send(command);

  return r2PublicUrl(webpKey);
}

// Delete file from R2
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket(),
    Key: key,
  });

  await r2Client().send(command);
}

// List all files with a prefix (e.g., all photos for an event)
export async function listFilesInR2(prefix: string): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: bucket(),
    Prefix: prefix,
  });

  const response = await r2Client().send(command);
  return response.Contents?.map((item) => item.Key!).filter(Boolean) || [];
}

// Generate a clean filename
export function generateFileKey(folder: string, filename: string): string {
  const timestamp = Date.now();
  const cleanName = filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");

  return `${folder}/${timestamp}-${cleanName}`;
}

// ---------------------------------------------------------------------------------------------
// Direct-to-R2 uploads (gallery). The browser PUTs to a short-lived presigned URL; the server then
// reads the object back, processes it and deletes it. See src/lib/photos/.
// ---------------------------------------------------------------------------------------------

/**
 * Separate client for presigning only. The SDK's default "flexible checksum" would add an
 * x-amz-checksum-crc32 parameter that R2 rejects on presigned PUTs, so it is switched to "when required".
 */
let signer: S3Client | undefined;
const presignClient = (): S3Client =>
  (signer ??= new S3Client({ ...connection(), requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" }));

/** Public URL of a key. */
export function r2PublicUrl(key: string): string {
  return `${r2Config().publicUrl}/${key}`;
}

/** Presigned PUT. The content type and exact length are part of the signature, so a different file will not upload. */
export async function presignPut(key: string, contentType: string, contentLength: number, expiresInSeconds = 300): Promise<string> {
  return getSignedUrl(
    presignClient(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType, ContentLength: contentLength }),
    { expiresIn: expiresInSeconds, signableHeaders: new Set(["content-type", "content-length"]) },
  );
}

/** Size in bytes and stored content type, or null if the object does not exist. */
export async function headR2(key: string): Promise<{ size: number; contentType: string } | null> {
  try {
    const r = await r2Client().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return { size: r.ContentLength ?? 0, contentType: r.ContentType ?? "" };
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound") return null;
    throw err;
  }
}

export async function getR2Buffer(key: string): Promise<Buffer> {
  const r = await r2Client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  const bytes = await r.Body!.transformToByteArray();
  return Buffer.from(bytes);
}

/** Server-side copy inside the bucket (no download). */
export async function copyInR2(fromKey: string, toKey: string): Promise<void> {
  await r2Client().send(
    new CopyObjectCommand({
      Bucket: bucket(),
      Key: toKey,
      CopySource: `${bucket()}/${encodeURI(fromKey)}`,
    }),
  );
}

/** Deletes keys, ignoring ones that are already gone. */
export async function deleteManyFromR2(keys: string[]): Promise<void> {
  const unique = Array.from(new Set(keys.filter(Boolean)));
  if (unique.length === 0) return;
  const result = await r2Client().send(
    new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: unique.map((Key) => ({ Key })), Quiet: true } }),
  );
  // A per-object failure does not throw: log it, or it disappears.
  if (result.Errors?.length) {
    console.error("[r2] some objects were not deleted", { count: result.Errors.length, codes: Array.from(new Set(result.Errors.map((e) => e.Code))) });
  }
}

/**
 * Deletes EVERY object under a prefix (paginated). Returns how many were deleted; throws on a storage error so the
 * caller can log it. Used when an event is deleted, so nothing under its folders outlives it.
 */
export async function deleteR2Prefix(prefix: string): Promise<number> {
  if (!prefix || !prefix.endsWith("/")) throw new Error("deleteR2Prefix needs a prefix ending in '/'");
  let deleted = 0;
  let token: string | undefined;
  do {
    const page = await r2Client().send(
      new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix, ContinuationToken: token }),
    );
    const keys = (page.Contents ?? []).map((o) => o.Key!).filter(Boolean);
    if (keys.length) {
      await deleteManyFromR2(keys);
      deleted += keys.length;
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return deleted;
}
