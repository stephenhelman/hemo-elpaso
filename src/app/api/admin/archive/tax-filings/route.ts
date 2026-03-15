import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";
import { AuditAction } from "@prisma/client";

export async function GET() {
  const filings = await prisma.taxFiling.findMany({
    orderBy: { year: "desc" },
  });
  return NextResponse.json({ filings });
}

export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageFinancials");
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const year = formData.get("year") as string | null;

  if (!file || !year) {
    return NextResponse.json(
      { error: "file and year are required" },
      { status: 400 },
    );
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are accepted" },
      { status: 400 },
    );
  }

  // Check if filing already exists for this year
  const existing = await prisma.taxFiling.findUnique({
    where: { year: parseInt(year) },
  });

  // Upload to R2
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `tax-filings/${year}/form-990-${year}.pdf`;
  const url = await uploadToR2(buffer, key, "application/pdf");

  if (existing) {
    // Delete old file and replace
    await deleteFromR2(existing.fileKey);
    const filing = await prisma.taxFiling.update({
      where: { id: existing.id },
      data: { fileUrl: url, fileKey: key, uploadedBy: admin.email },
    });
    return NextResponse.json({ filing });
  }

  const filing = await prisma.taxFiling.create({
    data: {
      year: parseInt(year),
      fileUrl: url,
      fileKey: key,
      uploadedBy: admin!.email,
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.TAX_FILING_UPLOADED,
      resourceType: "TaxFiling",
      resourceId: filing.id,
      details: `Form 990 uploaded for ${year}`,
    },
  });

  return NextResponse.json({ filing }, { status: 201 });
}
