import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } },
) {
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

    // Find document
    const document = await prisma.assistanceDocument.findUnique({
      where: { id: params.documentId },
      include: {
        application: true,
      },
    });

    if (!document || document.application.patientId !== patient.id) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Only allow deleting if application is draft or submitted
    if (!["DRAFT", "SUBMITTED"].includes(document.application.status)) {
      return NextResponse.json(
        { error: "Cannot delete documents in current status" },
        { status: 400 },
      );
    }

    // Delete from R2
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: document.fileKey,
        }),
      );
    } catch (error) {
      console.error("R2 deletion error:", error);
      // Continue even if R2 delete fails
    }

    // Delete from database
    await prisma.assistanceDocument.delete({
      where: { id: params.documentId },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: "assistance_document_deleted",
        resourceType: "AssistanceDocument",
        resourceId: document.id,
        details: `Deleted document: ${document.fileName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
