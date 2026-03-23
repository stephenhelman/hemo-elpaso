import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { calculateAgeTier } from "@/lib/family-utils";
import { AuditAction } from "@prisma/client";

async function getPatient(authId: string) {
  return prisma.patient.findUnique({
    where: { auth0Id: authId },
    include: { contactProfile: true },
  });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await getPatient(session.user.sub);
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const family = await prisma.family.findFirst({
    where: {
      OR: [
        { primaryPatientId: patient.id },
        { memberships: { some: { patientId: patient.id } } },
      ],
    },
    include: {
      memberships: {
        where: { status: { not: "DETACHED" } },
        include: { patient: { include: { contactProfile: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({ family });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await getPatient(session.user.sub);
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  // Check if patient already has a family
  const existing = await prisma.family.findFirst({
    where: {
      OR: [
        { primaryPatientId: patient.id },
        { memberships: { some: { patientId: patient.id } } },
      ],
    },
  });
  if (existing) return NextResponse.json({ family: existing });

  const { familyName } = await req.json();
  const name =
    familyName?.trim() ||
    `${patient.contactProfile?.lastName ?? "Family"} Family`;

  const family = await prisma.family.create({
    data: { name, primaryPatientId: patient.id },
  });

  await prisma.auditLog.create({
    data: {
      patientId: patient.id,
      action: AuditAction.FAMILY_CREATED,
      resourceType: "Family",
      resourceId: family.id,
      details: `Family "${name}" created`,
    },
  });

  return NextResponse.json({ family }, { status: 201 });
}
