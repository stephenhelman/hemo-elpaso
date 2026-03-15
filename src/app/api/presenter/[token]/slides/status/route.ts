import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkConversionJob } from "@/lib/cloudconvert";

interface Props {
  params: { token: string };
}

async function verifyPresenterToken(token: string) {
  const presenterToken = await prisma.presenterAccessToken.findUnique({
    where: { token },
  });
  if (!presenterToken || presenterToken.expiresAt < new Date()) return null;
  return presenterToken;
}

export async function GET(req: NextRequest, { params }: Props) {
  const presenterToken = await verifyPresenterToken(params.token);
  if (!presenterToken) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get("lang") ?? "en") as "en" | "es";
  const eventId = presenterToken.eventId;

  const presentation = await prisma.eventPresentation.findUnique({
    where: { eventId },
  });

  if (!presentation) {
    return NextResponse.json({ status: "none", lang });
  }

  // Get lang-specific fields
  const jobId =
    lang === "en"
      ? presentation.conversionJobIdEn
      : presentation.conversionJobIdEs;

  const conversionStatus =
    lang === "en"
      ? presentation.conversionStatusEn
      : presentation.conversionStatusEs;

  // Already done or no job in progress
  if (conversionStatus === "done" || !jobId) {
    return NextResponse.json({
      status: "done",
      lang,
      presentation,
    });
  }

  // Check CloudConvert job status
  if (conversionStatus === "processing") {
    const result = await checkConversionJob(
      jobId,
      eventId,
      lang, // pass lang so R2 keys are namespaced correctly
    );

    if (result.status === "processing") {
      return NextResponse.json({
        status: "processing",
        lang,
        progress: result.progress,
      });
    }

    if (result.status === "error") {
      const updateData =
        lang === "en"
          ? { conversionStatusEn: "error" }
          : { conversionStatusEs: "error" };

      await prisma.eventPresentation.update({
        where: { eventId },
        data: updateData,
      });

      return NextResponse.json({ status: "error", lang, error: result.error });
    }

    if (result.status === "done") {
      const updateData =
        lang === "en"
          ? {
              slideUrlsEn: result.slideUrls,
              totalSlidesEn: result.totalSlides,
              conversionStatusEn: "done",
              conversionJobIdEn: null as null,
            }
          : {
              slideUrlsEs: result.slideUrls,
              totalSlidesEs: result.totalSlides,
              conversionStatusEs: "done",
              conversionJobIdEs: null as null,
            };

      const updated = await prisma.eventPresentation.update({
        where: { eventId },
        data: updateData,
      });

      return NextResponse.json({
        status: "done",
        lang,
        presentation: updated,
        slideCount: result.totalSlides,
      });
    }
  }

  return NextResponse.json({ status: conversionStatus, lang });
}
