import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction, BoardApprovalType } from "@prisma/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const membership = await prisma.familyMembership.findUnique({
    where: { id: params.id },
    include: { family: true },
  });

  if (!membership) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (membership.family.primaryPatientId !== patient.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (membership.ageTier !== "ADULT") {
    return NextResponse.json({ error: "Only adult members can be detached" }, { status: 400 });
  }
  if (membership.status !== "ACTIVE") {
    return NextResponse.json({ error: "Member is not active" }, { status: 400 });
  }

  // Check if there's already a pending detachment approval
  const existingApproval = await prisma.boardApproval.findFirst({
    where: {
      resourceType: "FamilyMembership",
      resourceId: params.id,
      status: "PENDING",
    },
  });
  if (existingApproval) {
    return NextResponse.json({ error: "A detachment request is already pending" }, { status: 409 });
  }

  const approval = await prisma.boardApproval.create({
    data: {
      type: BoardApprovalType.FAMILY_DETACHMENT,
      requestedBy: patient.id,
      resourceType: "FamilyMembership",
      resourceId: params.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: patient.id,
      action: AuditAction.FAMILY_DETACHMENT_REQUESTED,
      resourceType: "FamilyMembership",
      resourceId: params.id,
      details: `Detachment requested for ${membership.firstName} ${membership.lastName}`,
    },
  });

  return NextResponse.json({ approval }, { status: 201 });
}
