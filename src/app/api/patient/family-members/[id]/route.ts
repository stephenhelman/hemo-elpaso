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

    // Update FamilyMember root fields
    const familyMember = await prisma.familyMember.update({
      where: { id: params.id },
      data: {
        relationship: body.relationship,
        hasBleedingDisorder: body.hasBleedingDisorder || false,
      },
    });

    // Update ContactProfile
    await prisma.contactProfile.update({
      where: { familyMemberId: params.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      },
    });

    // Upsert DisorderProfile
    if (body.hasBleedingDisorder && body.condition) {
      await prisma.disorderProfile.upsert({
        where: { familyMemberId: params.id },
        create: {
          familyMemberId: params.id,
          condition: body.condition,
          severity: body.severity || "",
        },
        update: {
          condition: body.condition,
          severity: body.severity || null,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: "FAMILY_MEMBER_UPDATED" as any,
        resourceType: "FamilyMember",
        resourceId: familyMember.id,
        details: `Updated family member: ${body.firstName} ${body.lastName}`,
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
      include: { contactProfile: true },
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
        action: "FAMILY_MEMBER_DELETED" as any,
        resourceType: "FamilyMember",
        resourceId: params.id,
        details: `Removed family member: ${existingMember.contactProfile?.firstName} ${existingMember.contactProfile?.lastName}`,
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
