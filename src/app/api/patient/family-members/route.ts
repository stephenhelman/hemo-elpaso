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

    const familyMember = await prisma.familyMember.create({
      data: {
        patientId: patient.id,
        relationship: body.relationship,
        hasBleedingDisorder: body.hasBleedingDisorder || false,
      },
    });

    // Create ContactProfile for this family member
    await prisma.contactProfile.create({
      data: {
        familyMemberId: familyMember.id,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      },
    });

    // Create DisorderProfile only if they have a bleeding disorder
    if (body.hasBleedingDisorder && body.condition) {
      await prisma.disorderProfile.create({
        data: {
          familyMemberId: familyMember.id,
          condition: body.condition,
          severity: body.severity || "",
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: patient.id,
        action: "FAMILY_MEMBER_ADDED" as any,
        resourceType: "FamilyMember",
        resourceId: familyMember.id,
        details: `Added family member: ${body.firstName} ${body.lastName}`,
      },
    });

    return NextResponse.json(familyMember);
  } catch (error) {
    console.error("Family member creation error:", error);
    return NextResponse.json(
      { error: "Failed to add family member" },
      { status: 500 },
    );
  }
}
