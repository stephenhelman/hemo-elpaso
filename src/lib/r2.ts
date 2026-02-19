import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
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
