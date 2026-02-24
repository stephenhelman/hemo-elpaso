import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import {
  ensurePatientExists,
  calculateGracePeriodEnd,
  getGracePeriodSource,
  calculateMigrationEligibility,
} from "@/lib/ensure-patient";
import { AuditAction } from "@prisma/client";
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

    // ── Step 1: Basic Info (Contact Profile) ─────────────────────────────────
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zipCode = formData.get("zipCode") as string;

    // ── Step 2: Diagnosis (Disorder Profile - optional) ──────────────────────
    const primaryCondition = formData.get("primaryCondition") as string;
    const severity = formData.get("severity") as string;
    const diagnosisDate = formData.get("diagnosisDate") as string;
    const treatingPhysician = formData.get("treatingPhysician") as string;
    const specialtyPharmacy = formData.get("specialtyPharmacy") as string;
    const diagnosisFile = formData.get("diagnosisLetter") as File | null;

    // Check if patient has a disorder
    const patientHasCondition =
      primaryCondition &&
      primaryCondition !== "" &&
      primaryCondition !== "none";

    // ── Step 3: Family Members ────────────────────────────────────────────────
    const familyMembersRaw = formData.get("familyMembers") as string;
    const familyMembers: Array<{
      firstName: string;
      lastName: string;
      dateOfBirth?: string;
      relationship: string;
      hasBleedingDisorder: boolean;
      condition?: string;
      severity?: string;
      diagnosisDate?: string;
      treatingPhysician?: string;
      specialtyPharmacy?: string;
    }> = familyMembersRaw ? JSON.parse(familyMembersRaw) : [];

    // Check if any family member has a disorder
    const familyHasCondition = familyMembers.some((m) => m.hasBleedingDisorder);

    // ── Step 4: Emergency Contact (on Patient) ────────────────────────────────
    const emergencyContactName = formData.get("emergencyName") as string;
    const emergencyContactRelationship = formData.get(
      "emergencyRelationship",
    ) as string;
    const emergencyContactPhone = formData.get("emergencyPhone") as string;

    // ── Step 5: Preferences ───────────────────────────────────────────────────
    const interestedTopicsRaw = formData.get("interestedTopics") as string;
    const preferredEventTimesRaw = formData.get(
      "preferredEventTimes",
    ) as string;
    const dietaryRestrictionsRaw = formData.get(
      "dietaryRestrictions",
    ) as string;
    const interestedTopics = interestedTopicsRaw
      ? JSON.parse(interestedTopicsRaw)
      : [];
    const preferredEventTimes = preferredEventTimesRaw
      ? JSON.parse(preferredEventTimesRaw)
      : [];
    const dietaryRestrictions = dietaryRestrictionsRaw
      ? JSON.parse(dietaryRestrictionsRaw)
      : [];
    const accessibilityNeeds =
      (formData.get("accessibilityNeeds") as string) || null;
    const emailNotifications = formData.get("emailNotifications") === "true";
    const smsNotifications = formData.get("smsNotifications") === "true";
    const languagePreference =
      (formData.get("languagePreference") as string) || "en";

    // ── Step 6: Consent ───────────────────────────────────────────────────────
    const hipaaConsent = formData.get("hipaaConsent") === "true";
    const photoConsent = formData.get("photoConsent") === "true";
    const communicationConsent =
      formData.get("communicationConsent") === "true";

    // ── Ensure patient stub exists ────────────────────────────────────────────
    const stub = await ensurePatientExists(
      session.user.sub,
      session.user.email,
    );
    const patientId = stub.id;

    // ── Calculate grace period ────────────────────────────────────────────────
    const registrationCompletedAt = new Date();
    const diagnosisGracePeriodEndsAt = calculateGracePeriodEnd(
      patientHasCondition,
      familyHasCondition,
    );
    const diagnosisGracePeriodSource = getGracePeriodSource(
      patientHasCondition,
      familyHasCondition,
    );

    // ── Upload patient's diagnosis letter (if they have condition) ────────────
    let diagnosisLetterUrl: string | null = null;
    let diagnosisLetterKey: string | null = null;
    let diagnosisLetterUploadedAt: Date | null = null;

    if (diagnosisFile && diagnosisFile.size > 0 && patientHasCondition) {
      const maxSize = 10 * 1024 * 1024; // 10 MB
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

      const fileExtension = diagnosisFile.name.split(".").pop();
      const uniqueId = crypto.randomBytes(16).toString("hex");
      const key = `diagnosis/patient/${patientId}/${uniqueId}.${fileExtension}`;

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

    // ── Create ContactProfile ─────────────────────────────────────────────────
    await prisma.contactProfile.create({
      data: {
        patientId,
        firstName,
        lastName,
        phone,
        dateOfBirth: new Date(dateOfBirth),
        addressLine1: address,
        city,
        state,
        zipCode,
      },
    });

    // ── Create DisorderProfile (only if patient has condition) ───────────────
    if (patientHasCondition) {
      await prisma.disorderProfile.create({
        data: {
          patientId,
          condition: primaryCondition,
          severity,
          dateOfDiagnosis: diagnosisDate ? new Date(diagnosisDate) : null,
          treatingPhysician: treatingPhysician || null,
          specialtyPharmacy: specialtyPharmacy || null,
          diagnosisLetterUrl,
          diagnosisLetterKey,
          diagnosisLetterUploadedAt,
        },
      });
    }

    // ── Create Preferences ────────────────────────────────────────────────────
    await prisma.patientPreferences.create({
      data: {
        patientId,
        interestedTopics,
        preferredEventTimes,
        maxTravelDistance:
          parseInt(formData.get("maxTravelDistance") as string) || 30,
        dietaryRestrictions,
        accessibilityNeeds,
        emailNotifications,
        smsNotifications,
      },
    });

    // ── Create Family Members ─────────────────────────────────────────────────
    for (const member of familyMembers) {
      const memberDOB = member.dateOfBirth
        ? new Date(member.dateOfBirth)
        : null;

      const familyMember = await prisma.familyMember.create({
        data: {
          patientId,
          relationship: member.relationship,
          hasBleedingDisorder: member.hasBleedingDisorder,
          migrationEligibleAt: memberDOB
            ? calculateMigrationEligibility(memberDOB)
            : null,
        },
      });

      // Create ContactProfile for family member
      await prisma.contactProfile.create({
        data: {
          familyMemberId: familyMember.id,
          firstName: member.firstName,
          lastName: member.lastName,
          dateOfBirth: memberDOB,
        },
      });

      // Create DisorderProfile for family member (if they have condition)
      if (member.hasBleedingDisorder && member.condition) {
        await prisma.disorderProfile.create({
          data: {
            familyMemberId: familyMember.id,
            condition: member.condition,
            severity: member.severity || null,
            dateOfDiagnosis: member.diagnosisDate
              ? new Date(member.diagnosisDate)
              : null,
            treatingPhysician:
              member.treatingPhysician || treatingPhysician || null, // Default to patient's doctor
            specialtyPharmacy:
              member.specialtyPharmacy || specialtyPharmacy || null, // Default to patient's pharmacy
          },
        });
      }
    }

    // ── Update Patient (timestamps, language, consent, emergency contact, grace period) ───
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        registrationCompletedAt,
        diagnosisGracePeriodEndsAt,
        diagnosisGracePeriodSource,
        preferredLanguage: languagePreference,
        consentToContact: communicationConsent,
        consentToPhotos: photoConsent,
        consentDate: registrationCompletedAt,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship,
      },
    });

    // ── Audit log ─────────────────────────────────────────────────────────────
    await prisma.auditLog.create({
      data: {
        patientId,
        action: AuditAction.REGISTRATION_COMPLETED,
        resourceType: "Patient",
        resourceId: patientId,
        details: `Completed registration${diagnosisLetterUrl ? " with diagnosis letter" : ""}${familyHasCondition ? ` with ${familyMembers.filter((m) => m.hasBleedingDisorder).length} family member(s) with condition` : ""}`,
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
