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

    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Verify ownership
    const existingMember = await prisma.familyMember.findUnique({
      where: { id: params.id },
    });

    if (!existingMember || existingMember.patientId !== patient.id) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 },
      );
    }

    const body = await request.json();

    const familyMember = await prisma.familyMember.update({
      where: { id: params.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        relationship: body.relationship,
        hasBleedingDisorder: body.hasBleedingDisorder || false, // ADD
        condition: body.condition || null, // ADD
        severity: body.severity || null, // ADD
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: "family_member_updated",
        resourceType: "FamilyMember",
        resourceId: familyMember.id,
        details: `Updated family member: ${familyMember.firstName} ${familyMember.lastName}`,
      },
    });

    return NextResponse.json(familyMember);
  } catch (error) {
    console.error("Family member update error:", error);
    return NextResponse.json(
      { error: "Failed to update family member" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    // Verify ownership
    const existingMember = await prisma.familyMember.findUnique({
      where: { id: params.id },
    });

    if (!existingMember || existingMember.patientId !== patient.id) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 },
      );
    }

    await prisma.familyMember.delete({
      where: { id: params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: "family_member_deleted",
        resourceType: "FamilyMember",
        resourceId: params.id,
        details: `Removed family member: ${existingMember.firstName} ${existingMember.lastName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Family member deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete family member" },
      { status: 500 },
    );
  }
}
