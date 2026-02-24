import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";
import { AuditAction } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
      include: { contactProfile: true, disorderProfile: true },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (patient.disorderProfile?.condition) {
      // Has a bleeding disorder - check if verified or within grace period
      const gracePeriodEnded = patient.diagnosisGracePeriodEndsAt
        ? new Date(patient.diagnosisGracePeriodEndsAt) < new Date()
        : false;

      if (!patient.disorderProfile?.diagnosisVerified && gracePeriodEnded) {
        return NextResponse.json(
          {
            error:
              "Diagnosis verification required. Please upload your diagnosis letter to apply for financial assistance.",
            code: "VERIFICATION_REQUIRED",
          },
          { status: 403 },
        );
      }
    }

    const body = await request.json();
    const {
      assistanceType,
      requestedAmount,
      purpose,
      description,
      status,
      submittedAt,
    } = body;

    // Validate
    if (!assistanceType || !requestedAmount || !purpose) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const validTypes = [
      "EVENT_FEES",
      "TRANSPORTATION",
      "MEDICATION",
      "MEDICAL_EQUIPMENT",
      "EMERGENCY_SUPPORT",
      "OTHER",
    ];
    if (!validTypes.includes(assistanceType)) {
      return NextResponse.json(
        { error: "Invalid assistance type" },
        { status: 400 },
      );
    }

    // Create application
    const application = await prisma.financialAssistanceApplication.create({
      data: {
        patientId: patient.id,
        assistanceType,
        requestedAmount: parseFloat(requestedAmount),
        purpose,
        description: description || null,
        status: status || "DRAFT",
        submittedAt: submittedAt ? new Date(submittedAt) : null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: AuditAction.ASSISTANCE_APPLICATION_CREATED,
        resourceType: "FinancialAssistanceApplication",
        resourceId: application.id,
        details: `Created ${status === "DRAFT" ? "draft" : "submitted"} application for ${assistanceType}`,
      },
    });

    // SEND EMAIL IF SUBMITTED (not draft)
    if (status === "SUBMITTED") {
      try {
        const typeLabels: Record<string, string> = {
          EVENT_FEES: "Event Fees",
          TRANSPORTATION: "Transportation",
          MEDICATION: "Medication",
          MEDICAL_EQUIPMENT: "Medical Equipment",
          EMERGENCY_SUPPORT: "Emergency Support",
          OTHER: "Other",
        };

        await sendEmail({
          templateType: "ASSISTANCE_SUBMITTED",
          recipient: patient.email,
          data: {
            patientName: `${patient.contactProfile?.firstName} ${patient.contactProfile?.lastName}`,
            assistanceType: typeLabels[assistanceType] || assistanceType,
            requestedAmount: `$${parseFloat(requestedAmount).toFixed(2)}`,
            applicationId: application.id,
          },
          patientId: patient.id,
        });
      } catch (emailError) {
        console.error(
          "Failed to send application submitted email:",
          emailError,
        );
        // Don't fail the application if email fails
      }
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
    });
  } catch (error) {
    console.error("Application creation error:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 },
    );
  }
}
