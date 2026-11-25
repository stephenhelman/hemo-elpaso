import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { uploadToR2, deleteFromR2, generateFileKey } from "@/lib/r2";
import { AuditAction } from "@prisma/client";
import { cleanAlt, FLYER_MAX_BYTES, FLYER_MIME } from "@/lib/flyers";

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

    // PNG, JPG or PDF, up to 10 MB. A form field that is present but empty means "no file".
    for (const f of [fileEn, fileEs]) {
      if (!f || typeof f === "string" || f.size === 0) continue;
      if (!(FLYER_MIME as readonly string[]).includes(f.type)) return NextResponse.json({ error: "Flyers must be PNG, JPG or PDF" }, { status: 400 });
      if (f.size > FLYER_MAX_BYTES) return NextResponse.json({ error: "Flyers must be 10 MB or smaller" }, { status: 400 });
    }
    const hasFile = (f: File | null): f is File => !!f && typeof f !== "string" && f.size > 0;
    // Alt text: only touched when the field is sent (so an upload from another form never wipes it).
    const altData: { flyerEnAlt?: string | null; flyerEsAlt?: string | null } = {};
    if (formData.has("flyerEnAlt")) altData.flyerEnAlt = cleanAlt(formData.get("flyerEnAlt"));
    if (formData.has("flyerEsAlt")) altData.flyerEsAlt = cleanAlt(formData.get("flyerEsAlt"));

    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let flyerEnUrl = event.flyerEnUrl;
    let flyerEsUrl = event.flyerEsUrl;

    // Upload English flyer
    if (hasFile(fileEn)) {
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
    if (hasFile(fileEs)) {
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
        ...altData,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.EVENT_FLYERS_UPDATED,
        resourceType: "Event",
        resourceId: params.id,
        details: `Updated event flyers (fields: ${[hasFile(fileEn) && "flyerEn", hasFile(fileEs) && "flyerEs", ...Object.keys(altData)].filter(Boolean).join(", ") || "none"})`,
      },
    });

    return NextResponse.json({ success: true, flyerEnUrl, flyerEsUrl, ...altData });
  } catch (error) {
    console.error("Flyer upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
