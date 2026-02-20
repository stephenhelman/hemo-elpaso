import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

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

    const formData = await request.formData();

    // Extract form data
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const addressLine1 = formData.get("addressLine1") as string;
    const addressLine2 = formData.get("addressLine2") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zipCode = formData.get("zipCode") as string;
    const primaryCondition = formData.get("primaryCondition") as string;
    const severity = formData.get("severity") as string;
    const dateOfDiagnosis = formData.get("dateOfDiagnosis") as string;
    const treatingPhysician = formData.get("treatingPhysician") as string;
    const specialtyPharmacy = formData.get("specialtyPharmacy") as string;
    const emergencyContactName = formData.get("emergencyContactName") as string;
    const emergencyContactPhone = formData.get(
      "emergencyContactPhone",
    ) as string;
    const emergencyContactRelationship = formData.get(
      "emergencyContactRelationship",
    ) as string;
    const preferredLanguage =
      (formData.get("preferredLanguage") as string) || "en";

    // Get diagnosis letter file (optional)
    const diagnosisFile = formData.get("diagnosisLetter") as File | null;

    // Find or create patient
    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Handle diagnosis letter upload if provided
    let diagnosisLetterUrl = null;
    let diagnosisLetterKey = null;
    let diagnosisLetterUploadedAt = null;

    if (diagnosisFile && primaryCondition) {
      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (diagnosisFile.size > maxSize) {
        return NextResponse.json(
          { error: "Diagnosis file too large (max 10MB)" },
          { status: 400 },
        );
      }

      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!allowedTypes.includes(diagnosisFile.type)) {
        return NextResponse.json(
          { error: "Invalid diagnosis file type" },
          { status: 400 },
        );
      }

      // Upload to R2
      const fileExtension = diagnosisFile.name.split(".").pop();
      const uniqueId = crypto.randomBytes(16).toString("hex");
      const key = `diagnosis/patient/${patient.id}/${uniqueId}.${fileExtension}`;

      const buffer = Buffer.from(await diagnosisFile.arrayBuffer());
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
          Body: buffer,
          ContentType: diagnosisFile.type,
        }),
      );

      diagnosisLetterUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
      diagnosisLetterKey = key;
      diagnosisLetterUploadedAt = new Date();
    }

    // Calculate grace period (60 days from now)
    const registrationCompletedAt = new Date();
    const diagnosisGracePeriodEndsAt = new Date();
    diagnosisGracePeriodEndsAt.setDate(
      diagnosisGracePeriodEndsAt.getDate() + 60,
    );

    // Update patient profile
    await prisma.patientProfile.upsert({
      where: { patientId: patient.id },
      create: {
        patientId: patient.id,
        firstName,
        lastName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        primaryCondition: primaryCondition || null,
        severity: severity || null,
        dateOfDiagnosis: dateOfDiagnosis ? new Date(dateOfDiagnosis) : null,
        treatingPhysician,
        specialtyPharmacy,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship,
        preferredLanguage,
      },
      update: {
        firstName,
        lastName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        primaryCondition: primaryCondition || null,
        severity: severity || null,
        dateOfDiagnosis: dateOfDiagnosis ? new Date(dateOfDiagnosis) : null,
        treatingPhysician,
        specialtyPharmacy,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship,
        preferredLanguage,
      },
    });

    // Update patient with diagnosis letter and grace period
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        registrationCompletedAt,
        diagnosisGracePeriodEndsAt,
        diagnosisLetterUrl,
        diagnosisLetterKey,
        diagnosisLetterUploadedAt,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: "registration_completed",
        resourceType: "Patient",
        resourceId: patient.id,
        details: `Completed registration${diagnosisLetterUrl ? " with diagnosis letter" : ""}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to complete registration" },
      { status: 500 },
    );
  }
}
