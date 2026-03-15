import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";
import { startConversionJob } from "@/lib/cloudconvert";
import sharp from "sharp";

interface Props {
  params: { token: string };
}

async function verifyPresenterToken(token: string) {
  const presenterToken = await prisma.presenterAccessToken.findUnique({
    where: { token },
    include: { event: true },
  });
  if (!presenterToken || presenterToken.expiresAt < new Date()) return null;
  return presenterToken;
}

export async function POST(req: NextRequest, { params }: Props) {
  const presenterToken = await verifyPresenterToken(params.token);
  if (!presenterToken) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }

  // Get lang from query param — defaults to "en"
  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get("lang") ?? "en") as "en" | "es";

  if (!["en", "es"].includes(lang)) {
    return NextResponse.json(
      { error: "lang must be 'en' or 'es'" },
      { status: 400 },
    );
  }

  const eventId = presenterToken.eventId;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 200 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File must be under 200MB" },
      { status: 400 },
    );
  }

  const fileName = file.name;
  const mimeType = file.type;
  const ext = fileName.split(".").pop()?.toLowerCase();
  const isImage = ["jpg", "jpeg", "png", "webp"].includes(ext ?? "");
  const isPresentation = ["pdf", "pptx", "ppt", "key", "odp"].includes(
    ext ?? "",
  );

  if (!isImage && !isPresentation) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Accepted: PDF, PPTX, KEY, ODP, JPG, PNG, WebP",
      },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Delete old slides for this language from R2
  const existing = await prisma.eventPresentation.findUnique({
    where: { eventId },
  });

  const oldSlideUrls =
    lang === "en"
      ? (existing?.slideUrlsEn ?? [])
      : (existing?.slideUrlsEs ?? []);

  if (oldSlideUrls.length) {
    await Promise.allSettled(
      oldSlideUrls.map((url) => {
        const parts = url.split("/");
        const key = parts.slice(-3).join("/");
        return deleteFromR2(key);
      }),
    );
  }

  // Lang-specific R2 prefix so En/Es slides don't overwrite each other
  const langPrefix = `events/${eventId}/slides/${lang}`;

  // ── IMAGE: fast path ───────────────────────────────────────────────────────
  if (isImage) {
    const processed = await sharp(buffer)
      .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const key = `${langPrefix}/slide-001.webp`;
    const slideUrl = await uploadToR2(processed, key, "image/webp");

    const updateData =
      lang === "en"
        ? {
            slideUrlsEn: [slideUrl],
            totalSlidesEn: 1,
            originalFileNameEn: fileName,
            originalFileUrlEn: null as null,
            originalFileKeyEn: null as null,
            conversionJobIdEn: null as null,
            conversionStatusEn: "done",
          }
        : {
            slideUrlsEs: [slideUrl],
            totalSlidesEs: 1,
            originalFileNameEs: fileName,
            originalFileUrlEs: null as null,
            originalFileKeyEs: null as null,
            conversionJobIdEs: null as null,
            conversionStatusEs: "done",
          };

    const presentation = await prisma.eventPresentation.upsert({
      where: { eventId },
      create: { eventId, ...updateData },
      update: updateData,
    });

    return NextResponse.json({
      status: "done",
      presentation,
      lang,
      slideCount: 1,
    });
  }

  // ── PRESENTATION: upload original + start async CloudConvert job ───────────
  const originalKey = `${langPrefix}/original-${Date.now()}-${fileName}`;
  const originalUrl = await uploadToR2(buffer, originalKey, mimeType);

  const jobId = await startConversionJob(buffer, fileName, mimeType);

  const updateData =
    lang === "en"
      ? {
          slideUrlsEn: [] as string[],
          totalSlidesEn: 0,
          originalFileUrlEn: originalUrl,
          originalFileKeyEn: originalKey,
          originalFileNameEn: fileName,
          conversionJobIdEn: jobId,
          conversionStatusEn: "processing",
        }
      : {
          slideUrlsEs: [] as string[],
          totalSlidesEs: 0,
          originalFileUrlEs: originalUrl,
          originalFileKeyEs: originalKey,
          originalFileNameEs: fileName,
          conversionJobIdEs: jobId,
          conversionStatusEs: "processing",
        };

  await prisma.eventPresentation.upsert({
    where: { eventId },
    create: { eventId, ...updateData },
    update: updateData,
  });

  return NextResponse.json({
    status: "processing",
    lang,
    jobId,
    message: `Converting ${fileName} — this may take 1–3 minutes for large files`,
  });
}
