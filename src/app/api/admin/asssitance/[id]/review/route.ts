import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function PATCH(
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

    const body = await request.json();
    const { action, approvedAmount, reviewNotes, reviewedBy } = body;

    if (!["APPROVE", "DENY"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Find application
    const application = await prisma.financialAssistanceApplication.findUnique({
      where: { id: params.id },
      include: {
        patient: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    // Only allow reviewing submitted or under_review applications
    if (!["SUBMITTED", "UNDER_REVIEW"].includes(application.status)) {
      return NextResponse.json(
        { error: "Application cannot be reviewed" },
        { status: 400 },
      );
    }

    // Update application
    const updateData: any = {
      status: action === "APPROVE" ? "APPROVED" : "DENIED",
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: reviewNotes || null,
    };

    if (action === "APPROVE") {
      if (!approvedAmount || approvedAmount <= 0) {
        return NextResponse.json(
          { error: "Invalid approved amount" },
          { status: 400 },
        );
      }
      updateData.approvedAmount = approvedAmount;
    }

    await prisma.financialAssistanceApplication.update({
      where: { id: params.id },
      data: updateData,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: `assistance_application_${action.toLowerCase()}`,
        resourceType: "FinancialAssistanceApplication",
        resourceId: application.id,
        details: `${action === "APPROVE" ? "Approved" : "Denied"} application for ${application.patient.profile?.firstName} ${application.patient.profile?.lastName} - ${application.assistanceType}`,
      },
    });

    // TODO: Send email notification to patient
    // Will implement in email notifications phase

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Review error:", error);
    return NextResponse.json(
      { error: "Failed to review application" },
      { status: 500 },
    );
  }
}
