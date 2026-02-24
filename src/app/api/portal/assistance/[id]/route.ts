import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
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

    // Find application
    const application = await prisma.financialAssistanceApplication.findUnique({
      where: { id: params.id },
    });

    if (!application || application.patientId !== patient.id) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    // Only allow editing drafts or submitted applications
    if (!["DRAFT", "SUBMITTED"].includes(application.status)) {
      return NextResponse.json(
        { error: "Cannot edit application in current status" },
        { status: 400 },
      );
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

    // Update application
    const updated = await prisma.financialAssistanceApplication.update({
      where: { id: params.id },
      data: {
        assistanceType,
        requestedAmount: parseFloat(requestedAmount),
        purpose,
        description: description || null,
        status: status || application.status,
        submittedAt: submittedAt
          ? new Date(submittedAt)
          : application.submittedAt,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: AuditAction.ASSISTANCE_APPLICATION_UPDATED,
        resourceType: "FinancialAssistanceApplication",
        resourceId: updated.id,
        details: `Updated application for ${assistanceType}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Application update error:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }
}
