import CloudConvert from "cloudconvert";
import { uploadToR2 } from "@/lib/r2";
import sharp from "sharp";

const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY!);

export type JobStatusResult =
  | { status: "processing"; progress?: number }
  | { status: "done"; slideUrls: string[]; totalSlides: number }
  | { status: "error"; error: string };

// -------------------------------------------------------
// Start conversion job — returns jobId immediately
// -------------------------------------------------------
export async function startConversionJob(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const isPdf = mimeType === "application/pdf" || ext === "pdf";
  const isOffice = ["pptx", "ppt", "key", "odp"].includes(ext ?? "");

  if (!isPdf && !isOffice) {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  let job;

  if (isPdf) {
    job = await cloudConvert.jobs.create({
      tasks: {
        "upload-file": { operation: "import/upload" },
        "convert-to-images": {
          operation: "convert",
          input: ["upload-file"],
          input_format: "pdf",
          output_format: "jpg",
          engine: "mupdf",
          filename: "slide-%d.jpg",
          pixel_density: 150,
          fit: "max",
          width: 1920,
          height: 1080,
        },
        "export-images": {
          operation: "export/url",
          input: ["convert-to-images"],
          inline: false,
          archive_multiple_files: false,
        },
      },
    });
  } else {
    const inputFormat = ["pptx", "ppt"].includes(ext ?? "")
      ? "pptx"
      : (ext as "key" | "odp");

    job = await cloudConvert.jobs.create({
      tasks: {
        "upload-file": { operation: "import/upload" },
        "convert-to-pdf": {
          operation: "convert",
          input: ["upload-file"],
          input_format: inputFormat,
          output_format: "pdf",
          engine: "libreoffice",
        },
        "convert-to-images": {
          operation: "convert",
          input: ["convert-to-pdf"],
          input_format: "pdf",
          output_format: "jpg",
          engine: "mupdf",
          filename: "slide-%d.jpg",
          pixel_density: 150,
          fit: "max",
          width: 1920,
          height: 1080,
        },
        "export-images": {
          operation: "export/url",
          input: ["convert-to-images"],
          inline: false,
          archive_multiple_files: false,
        },
      },
    });
  }

  const uploadTask = job.tasks.find((t) => t.name === "upload-file")!;
  await cloudConvert.tasks.upload(uploadTask, fileBuffer, fileName);

  return job.id;
}

// -------------------------------------------------------
// Check job status — downloads and uploads to R2 when done
// lang parameter ensures En/Es slides go to separate R2 paths
// -------------------------------------------------------
export async function checkConversionJob(
  jobId: string,
  eventId: string,
  lang: "en" | "es" = "en",
): Promise<JobStatusResult> {
  let job;

  try {
    job = await cloudConvert.jobs.get(jobId);
  } catch (err: any) {
    return { status: "error", error: `Job not found: ${err.message}` };
  }

  if (job.status === "processing" || job.status === "waiting") {
    const totalTasks = job.tasks.length;
    const completedTasks = job.tasks.filter(
      (t) => t.status === "finished",
    ).length;
    const progress = Math.round((completedTasks / totalTasks) * 100);
    return { status: "processing", progress };
  }

  if (job.status === "error") {
    const failedTask = job.tasks.find((t) => t.status === "error");
    return {
      status: "error",
      error: failedTask?.message ?? "Conversion failed",
    };
  }

  if (job.status === "finished") {
    const exportTask = job.tasks.find((t) => t.name === "export-images");

    if (!exportTask?.result?.files?.length) {
      return { status: "error", error: "No output files from conversion" };
    }

    // Sort numerically: slide-1.jpg, slide-2.jpg, ..., slide-128.jpg
    const files = [...exportTask.result.files].sort((a, b) => {
      const numA = parseInt(a.filename.match(/\d+/)?.[0] ?? "0");
      const numB = parseInt(b.filename.match(/\d+/)?.[0] ?? "0");
      return numA - numB;
    });

    // Process in batches of 10 to manage memory
    const BATCH_SIZE = 10;
    const slideUrls: string[] = new Array(files.length);

    for (
      let batchStart = 0;
      batchStart < files.length;
      batchStart += BATCH_SIZE
    ) {
      const batch = files.slice(batchStart, batchStart + BATCH_SIZE);

      await Promise.all(
        batch.map(async (file, batchIdx) => {
          const globalIdx = batchStart + batchIdx;

          const response = await fetch(file.url);
          if (!response.ok) {
            throw new Error(`Failed to download slide ${globalIdx + 1}`);
          }

          const imageBuffer = Buffer.from(await response.arrayBuffer());
          const optimized = await sharp(imageBuffer)
            .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

          // Lang-namespaced R2 key — en and es slides never collide
          const key = `events/${eventId}/slides/${lang}/slide-${String(globalIdx + 1).padStart(3, "0")}.webp`;
          const url = await uploadToR2(optimized, key, "image/webp");
          slideUrls[globalIdx] = url;
        }),
      );
    }

    return { status: "done", slideUrls, totalSlides: slideUrls.length };
  }

  return { status: "processing" };
}
