import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { uploadImageToR2, generateFileKey } from "@/lib/r2";
import { AuditAction } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const photos = await prisma.eventPhoto.findMany({
      where: { eventId: params.id },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Photos fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) return error;

    const formData = await request.formData();
    const files = formData.getAll("photos") as File[];
    const caption = formData.get("caption") as string | null;

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedPhotos = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const key = generateFileKey(`photos/${params.id}`, file.name);

      // Upload and optimize
      const url = await uploadImageToR2(buffer, key, 1920);

      // Save to database
      const photo = await prisma.eventPhoto.create({
        data: {
          eventId: params.id,
          url,
          key,
          caption,
          uploadedBy: admin.email,
        },
      });

      uploadedPhotos.push(photo);
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.EVENT_PHOTOS_UPLOADED,
        resourceType: "Event",
        resourceId: params.id,
        details: `Uploaded ${files.length} photo(s)`,
      },
    });

    return NextResponse.json({ success: true, photos: uploadedPhotos });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
