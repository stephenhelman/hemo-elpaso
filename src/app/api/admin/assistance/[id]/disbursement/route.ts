import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email-service"; // ADD THIS

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

    const body = await request.json();
    const { amount, paymentMethod, checkNumber, issueDate, notes, issuedBy } =
      body;

    // Validate
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!["CHECK", "CASH", "REIMBURSEMENT"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    }

    if (paymentMethod === "CHECK" && !checkNumber) {
      return NextResponse.json(
        { error: "Check number required" },
        { status: 400 },
      );
    }

    // Find application
    const application = await prisma.financialAssistanceApplication.findUnique({
      where: { id: params.id },
      include: {
        disbursements: true,
        patient: {
          include: {
            contactProfile: true,
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

    // Only allow disbursement for approved applications
    if (application.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Application not approved" },
        { status: 400 },
      );
    }

    // Check if amount exceeds remaining balance
    const totalDisbursed = application.disbursements.reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );
    const remaining = Number(application.approvedAmount || 0) - totalDisbursed;

    if (amount > remaining) {
      return NextResponse.json(
        {
          error: `Amount exceeds remaining balance ($${remaining.toFixed(2)})`,
        },
        { status: 400 },
      );
    }

    // Create disbursement
    const disbursement = await prisma.assistanceDisbursement.create({
      data: {
        applicationId: params.id,
        amount,
        paymentMethod,
        checkNumber: checkNumber || null,
        issueDate: new Date(issueDate),
        status: "ISSUED",
        issuedBy,
        notes: notes || null,
      },
    });

    // Update application status to DISBURSED if fully disbursed
    const newTotalDisbursed = totalDisbursed + amount;
    if (newTotalDisbursed >= Number(application.approvedAmount || 0)) {
      await prisma.financialAssistanceApplication.update({
        where: { id: params.id },
        data: { status: "DISBURSED" },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: "assistance_disbursement_created",
        resourceType: "AssistanceDisbursement",
        resourceId: disbursement.id,
        details: `Created disbursement of $${amount} for ${application.patient.contactProfile?.firstName} ${application.patient.contactProfile?.lastName}`,
      },
    });

    // SEND DISBURSEMENT EMAIL
    try {
      const typeLabels: Record<string, string> = {
        EVENT_FEES: "Event Fees",
        TRANSPORTATION: "Transportation",
        MEDICATION: "Medication",
        MEDICAL_EQUIPMENT: "Medical Equipment",
        EMERGENCY_SUPPORT: "Emergency Support",
        OTHER: "Other",
      };

      const paymentMethodLabels: Record<string, string> = {
        CHECK: "Check",
        CASH: "Cash",
        REIMBURSEMENT: "Reimbursement",
      };

      await sendEmail({
        templateType: "DISBURSEMENT_ISSUED",
        recipient: application.patient.email,
        data: {
          patientName: `${application.patient.contactProfile?.firstName} ${application.patient.contactProfile?.lastName}`,
          assistanceType:
            typeLabels[application.assistanceType] ||
            application.assistanceType,
          amount: `$${Number(amount).toFixed(2)}`,
          paymentMethod: paymentMethodLabels[paymentMethod] || paymentMethod,
          checkNumber: checkNumber || "N/A",
          expectedDate:
            paymentMethod === "CHECK"
              ? "within 5-7 business days"
              : "immediately",
        },
        patientId: application.patientId,
      });
    } catch (emailError) {
      console.error("Failed to send disbursement email:", emailError);
      // Don't fail the disbursement if email fails
    }

    return NextResponse.json({
      success: true,
      disbursementId: disbursement.id,
    });
  } catch (error) {
    console.error("Disbursement creation error:", error);
    return NextResponse.json(
      { error: "Failed to create disbursement" },
      { status: 500 },
    );
  }
}
