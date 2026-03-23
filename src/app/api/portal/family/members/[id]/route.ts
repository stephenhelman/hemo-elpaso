import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { calculateAgeTier } from "@/lib/family-utils";
import { AuditAction } from "@prisma/client";

async function getAuthorizedMembership(membershipId: string, patientId: string) {
  const membership = await prisma.familyMembership.findUnique({
    where: { id: membershipId },
    include: { family: true },
  });
  if (!membership) return null;
  // Only the primary patient of the family can manage members
  if (membership.family.primaryPatientId !== patientId) return null;
  return membership;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await prisma.patient.findUnique({ where: { auth0Id: session.user.sub } });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const membership = await getAuthorizedMembership(params.id, patient.id);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { firstName, lastName, dateOfBirth, relationship, hasBleedingDisorder, disorderCondition, disorderSeverity } = await req.json();

  const dob = dateOfBirth ? new Date(dateOfBirth) : membership.dateOfBirth;
  const ageTier = calculateAgeTier(dob);

  const updated = await prisma.familyMembership.update({
    where: { id: params.id },
    data: {
      firstName: firstName ?? membership.firstName,
      lastName: lastName ?? membership.lastName,
      dateOfBirth: dob,
      relationship: relationship ?? membership.relationship,
      ageTier,
      hasBleedingDisorder: hasBleedingDisorder ?? membership.hasBleedingDisorder,
      disorderCondition: disorderCondition !== undefined ? disorderCondition : membership.disorderCondition,
      disorderSeverity: disorderSeverity !== undefined ? disorderSeverity : membership.disorderSeverity,
    },
  });

  return NextResponse.json({ membership: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await prisma.patient.findUnique({ where: { auth0Id: session.user.sub } });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const membership = await getAuthorizedMembership(params.id, patient.id);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Cannot delete members who have a linked patient account
  if (membership.patientId) {
    return NextResponse.json({ error: "Cannot delete a member with a linked account. Use detachment instead." }, { status: 400 });
  }

  await prisma.familyMembership.delete({ where: { id: params.id } });

  await prisma.auditLog.create({
    data: {
      patientId: patient.id,
      action: AuditAction.FAMILY_MEMBER_DELETED,
      resourceType: "FamilyMembership",
      resourceId: params.id,
      details: `Deleted family member ${membership.firstName} ${membership.lastName}`,
    },
  });

  return NextResponse.json({ success: true });
}
