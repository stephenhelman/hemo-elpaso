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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const applicationId = formData.get("applicationId") as string;
    const description = formData.get("description") as string;

    if (!file || !applicationId) {
      return NextResponse.json(
        { error: "Missing file or applicationId" },
        { status: 400 },
      );
    }

    // Verify application belongs to patient
    const application = await prisma.financialAssistanceApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application || application.patientId !== patient.id) {
      return NextResponse.json(
        { error: "Application not found" },
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
      "image/heic",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Generate unique key
    const fileExtension = file.name.split(".").pop();
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const key = `assistance/${applicationId}/${uniqueId}.${fileExtension}`;

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

    // Save to database
    const document = await prisma.assistanceDocument.create({
      data: {
        applicationId,
        fileName: file.name,
        fileUrl,
        fileKey: key,
        fileSize: file.size,
        mimeType: file.type,
        description: description || null,
        uploadedBy: patient.email,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: AuditAction.ASSISTANCE_DOCUMENT_UPLOADED,
        resourceType: "AssistanceDocument",
        resourceId: document.id,
        details: `Uploaded document: ${file.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      documentId: document.id,
      fileUrl,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
