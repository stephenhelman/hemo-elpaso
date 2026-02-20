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
    const { action, rejectedReason, verifiedBy } = body;

    if (!["approve", "deny"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (action === "deny" && !rejectedReason) {
      return NextResponse.json(
        { error: "Rejection reason required" },
        { status: 400 },
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: { profile: true },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Update verification status
    await prisma.patient.update({
      where: { id: params.id },
      data: {
        diagnosisVerified: action === "approve",
        diagnosisVerifiedBy: action === "approve" ? verifiedBy : null,
        diagnosisVerifiedAt: action === "approve" ? new Date() : null,
        diagnosisRejectedReason: action === "deny" ? rejectedReason : null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: `diagnosis_${action}d`,
        resourceType: "Patient",
        resourceId: patient.id,
        details: `${action === "approve" ? "Approved" : "Rejected"} diagnosis letter for ${patient.profile?.firstName} ${patient.profile?.lastName}`,
      },
    });

    // TODO: Send email notification to patient

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Failed to update verification" },
      { status: 500 },
    );
  }
}
