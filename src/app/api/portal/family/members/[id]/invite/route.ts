import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";
import { AuditAction } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: { contactProfile: true },
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
  if (membership.ageTier === "RECORD_ONLY") {
    return NextResponse.json({ error: "Cannot invite members under 13" }, { status: 400 });
  }
  if (membership.patientId) {
    return NextResponse.json({ error: "Member already has a linked account" }, { status: 400 });
  }

  const { email, parentalConsentGiven } = await req.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  // For YOUTH members, parental consent must be given before invite
  if (membership.ageTier === "YOUTH" && !parentalConsentGiven) {
    return NextResponse.json({ error: "Parental consent is required for youth members" }, { status: 400 });
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/register?invite=${membership.id}`;
  const inviterName = patient.contactProfile
    ? `${patient.contactProfile.firstName} ${patient.contactProfile.lastName}`
    : patient.email;

  // Update membership with invite info
  await prisma.familyMembership.update({
    where: { id: params.id },
    data: {
      inviteEmail: email,
      inviteSentAt: new Date(),
      status: "PENDING_INVITE",
      ...(membership.ageTier === "YOUTH" && parentalConsentGiven
        ? { parentalConsentGiven: true, parentalConsentAt: new Date(), parentalConsentBy: patient.id }
        : {}),
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: patient.id,
      action: AuditAction.FAMILY_MEMBER_INVITED,
      resourceType: "FamilyMembership",
      resourceId: membership.id,
      details: `Invite sent to ${email} for family member ${membership.firstName} ${membership.lastName}`,
    },
  });

  try {
    await sendEmail({
      templateType: "FAMILY_MEMBER_INVITE",
      recipient: email,
      data: {
        inviteeName: `${membership.firstName} ${membership.lastName}`,
        inviterName,
        familyName: membership.family.name,
        inviteUrl,
      },
      patientId: patient.id,
      fromEmail: "HOEP <noreply@hemo-el-paso.org>",
    });
  } catch (emailErr) {
    console.error("Failed to send family invite email:", emailErr);
  }

  return NextResponse.json({ success: true });
}
