import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { calculateAgeTier } from "@/lib/family-utils";
import { AuditAction } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  // Get or create family
  let family = await prisma.family.findFirst({
    where: {
      OR: [
        { primaryPatientId: patient.id },
        { memberships: { some: { patientId: patient.id } } },
      ],
    },
  });

  if (!family) {
    return NextResponse.json(
      { error: "Create a family first" },
      { status: 400 }
    );
  }

  const {
    firstName,
    lastName,
    dateOfBirth,
    relationship,
    hasBleedingDisorder,
    disorderCondition,
    disorderSeverity,
  } = await req.json();

  if (!firstName || !lastName || !relationship) {
    return NextResponse.json({ error: "firstName, lastName, relationship are required" }, { status: 400 });
  }

  const dob = dateOfBirth ? new Date(dateOfBirth) : null;
  const ageTier = calculateAgeTier(dob);

  const membership = await prisma.familyMembership.create({
    data: {
      familyId: family.id,
      firstName,
      lastName,
      dateOfBirth: dob,
      relationship,
      ageTier,
      hasBleedingDisorder: !!hasBleedingDisorder,
      disorderCondition: hasBleedingDisorder ? disorderCondition || null : null,
      disorderSeverity: hasBleedingDisorder ? disorderSeverity || null : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: patient.id,
      action: AuditAction.FAMILY_MEMBER_INVITED,
      resourceType: "FamilyMembership",
      resourceId: membership.id,
      details: `Added family member ${firstName} ${lastName}`,
    },
  });

  return NextResponse.json({ membership }, { status: 201 });
}
