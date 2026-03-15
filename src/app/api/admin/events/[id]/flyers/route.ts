import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadToR2, deleteFromR2, generateFileKey } from "@/lib/r2";
import { AuditAction } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) return error;

    const formData = await request.formData();
    const fileEn = formData.get("flyerEn") as File | null;
    const fileEs = formData.get("flyerEs") as File | null;

    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let flyerEnUrl = event.flyerEnUrl;
    let flyerEsUrl = event.flyerEsUrl;

    // Upload English flyer
    if (fileEn) {
      // Delete old flyer if exists
      if (event.flyerEnUrl) {
        const oldKey = event.flyerEnUrl.replace(
          `${process.env.R2_PUBLIC_URL}/`,
          "",
        );
        await deleteFromR2(oldKey).catch(console.error);
      }

      const buffer = Buffer.from(await fileEn.arrayBuffer());
      const key = generateFileKey(`flyers/${params.id}`, `en-${fileEn.name}`);
      flyerEnUrl = await uploadToR2(buffer, key, fileEn.type);
    }

    // Upload Spanish flyer
    if (fileEs) {
      // Delete old flyer if exists
      if (event.flyerEsUrl) {
        const oldKey = event.flyerEsUrl.replace(
          `${process.env.R2_PUBLIC_URL}/`,
          "",
        );
        await deleteFromR2(oldKey).catch(console.error);
      }

      const buffer = Buffer.from(await fileEs.arrayBuffer());
      const key = generateFileKey(`flyers/${params.id}`, `es-${fileEs.name}`);
      flyerEsUrl = await uploadToR2(buffer, key, fileEs.type);
    }

    // Update event
    await prisma.event.update({
      where: { id: params.id },
      data: {
        flyerEnUrl,
        flyerEsUrl,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.EVENT_FLYERS_UPDATED,
        resourceType: "Event",
        resourceId: params.id,
        details: `Updated event flyers`,
      },
    });

    return NextResponse.json({ success: true, flyerEnUrl, flyerEsUrl });
  } catch (error) {
    console.error("Flyer upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
