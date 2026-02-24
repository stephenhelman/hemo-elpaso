import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { AuditAction } from "@prisma/client";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!admin || !["board", "admin"].includes(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const disbursementId = formData.get("disbursementId") as string;

    if (!file || !disbursementId) {
      return NextResponse.json(
        { error: "Missing file or disbursementId" },
        { status: 400 },
      );
    }

    // Verify disbursement belongs to application
    const disbursement = await prisma.assistanceDisbursement.findUnique({
      where: { id: disbursementId },
    });

    if (!disbursement || disbursement.applicationId !== params.id) {
      return NextResponse.json(
        { error: "Disbursement not found" },
        { status: 404 },
      );
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 },
      );
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Generate unique key
    const fileExtension = file.name.split(".").pop();
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const key = `assistance/disbursements/${params.id}/${uniqueId}.${fileExtension}`;

    // Upload to R2
    const buffer = Buffer.from(await file.arrayBuffer());
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    // Update disbursement
    await prisma.assistanceDisbursement.update({
      where: { id: disbursementId },
      data: {
        proofOfPaymentUrl: fileUrl,
        proofOfPaymentKey: key,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.DISBURSEMENT_PROOF_UPLOADED,
        resourceType: "AssistanceDisbursement",
        resourceId: disbursementId,
        details: `Uploaded proof of payment: ${file.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      fileUrl,
    });
  } catch (error) {
    console.error("Proof upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload proof of payment" },
      { status: 500 },
    );
  }
}
