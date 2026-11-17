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

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Upload any file (PDF, images, etc)
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await r2Client.send(command);

  return `${process.env.R2_PUBLIC_URL}/${key}`;
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
    Bucket: process.env.R2_BUCKET_NAME,
    Key: webpKey,
    Body: optimized,
    ContentType: "image/webp",
  });

  await r2Client.send(command);

  return `${process.env.R2_PUBLIC_URL}/${webpKey}`;
}

// Delete file from R2
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

// List all files with a prefix (e.g., all photos for an event)
export async function listFilesInR2(prefix: string): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET_NAME,
    Prefix: prefix,
  });

  const response = await r2Client.send(command);
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
const presignClient = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

/** Public URL of a key (the bucket is served on R2_PUBLIC_URL). */
export function r2PublicUrl(key: string): string {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

/** Presigned PUT. The content type and exact length are part of the signature, so a different file will not upload. */
export async function presignPut(key: string, contentType: string, contentLength: number, expiresInSeconds = 300): Promise<string> {
  return getSignedUrl(
    presignClient,
    new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, ContentType: contentType, ContentLength: contentLength }),
    { expiresIn: expiresInSeconds, signableHeaders: new Set(["content-type", "content-length"]) },
  );
}

/** Size in bytes, or null if the object does not exist. */
export async function headR2(key: string): Promise<{ size: number } | null> {
  try {
    const r = await r2Client.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
    return { size: r.ContentLength ?? 0 };
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound") return null;
    throw err;
  }
}

export async function getR2Buffer(key: string): Promise<Buffer> {
  const r = await r2Client.send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
  const bytes = await r.Body!.transformToByteArray();
  return Buffer.from(bytes);
}

/** Server-side copy inside the bucket (no download). */
export async function copyInR2(fromKey: string, toKey: string): Promise<void> {
  await r2Client.send(
    new CopyObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: toKey,
      CopySource: `${process.env.R2_BUCKET_NAME}/${encodeURI(fromKey)}`,
    }),
  );
}

/** Deletes keys, ignoring ones that are already gone. */
export async function deleteManyFromR2(keys: string[]): Promise<void> {
  const unique = Array.from(new Set(keys.filter(Boolean)));
  if (unique.length === 0) return;
  await r2Client.send(
    new DeleteObjectsCommand({ Bucket: process.env.R2_BUCKET_NAME, Delete: { Objects: unique.map((Key) => ({ Key })), Quiet: true } }),
  );
}
