import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

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
        action: "assistance_application_created",
        resourceType: "FinancialAssistanceApplication",
        resourceId: application.id,
        details: `Created ${status === "DRAFT" ? "draft" : "submitted"} application for ${assistanceType}`,
      },
    });

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
