import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { AuditAction, BoardRoleType } from "@prisma/client";
import { sendEmail } from "@/lib/email-service";

const ROLE_TITLE: Record<BoardRoleType, { en: string; es: string }> = {
  PRESIDENT:               { en: "President",              es: "Presidente/a" },
  VICE_PRESIDENT:          { en: "Vice President",         es: "Vicepresidente/a" },
  TREASURER:               { en: "Treasurer",              es: "Tesorero/a" },
  SECRETARY:               { en: "Secretary",              es: "Secretario/a" },
  EVENTS_COORDINATOR:      { en: "Events Coordinator",     es: "Coordinador/a de Eventos" },
  SPONSOR_LIAISON:         { en: "Sponsor Liaison",        es: "Enlace de Patrocinadores" },
  COMMUNICATIONS_LEAD:     { en: "Communications Lead",    es: "Líder de Comunicaciones" },
  YOUTH_COORDINATOR:       { en: "Youth Coordinator",      es: "Coordinador/a de Jóvenes" },
  VOLUNTEER_COORDINATOR:   { en: "Volunteer Coordinator",  es: "Coordinador/a de Voluntarios" },
  FUNDRAISING_COORDINATOR: { en: "Fundraising Coordinator",es: "Coordinador/a de Recaudación" },
  BOARD_MEMBER_AT_LARGE:   { en: "Board Member At Large",  es: "Miembro de la Junta en General" },
};

export async function GET() {
  const { error } = await requirePermission("canAssignBoardRoles");
  if (error) return error;

  const boardRoles = await prisma.boardRole.findMany({
    include: {
      patient: {
        include: { contactProfile: true },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  return NextResponse.json({ boardRoles });
}

export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canAssignBoardRoles");
  if (error) return error;

  const { patientId, role, fromEmail } = await req.json();

  if (!patientId || !role) {
    return NextResponse.json(
      { error: "patientId and role are required" },
      { status: 400 },
    );
  }

  // Validate role is a valid BoardRoleType
  if (!Object.values(BoardRoleType).includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Check if this patient already has this role (active)
  const existing = await prisma.boardRole.findFirst({
    where: { patientId, role, active: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "This patient already holds this role" },
      { status: 409 },
    );
  }

  // If a previous inactive record exists for this combo, reactivate it
  const inactive = await prisma.boardRole.findFirst({
    where: { patientId, role, active: false },
  });

  const boardRole = inactive
    ? await prisma.boardRole.update({
        where: { id: inactive.id },
        data: {
          active: true,
          fromEmail: fromEmail || null,
          assignedBy: admin!.email,
          assignedAt: new Date(),
        },
        include: { patient: { include: { contactProfile: true } } },
      })
    : await prisma.boardRole.create({
        data: {
          patientId,
          role,
          fromEmail: fromEmail || null,
          assignedBy: admin!.email,
        },
        include: { patient: { include: { contactProfile: true } } },
      });

  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.BOARD_ROLE_ASSIGNED,
      resourceType: "BoardRole",
      resourceId: boardRole.id,
      details: `Role ${role} assigned to patient ${patientId} by ${admin!.email}`,
    },
  });

  // Part B — send onboarding email + create BoardOnboarding record
  try {
    const lang = (boardRole.patient.preferredLanguage === "es" ? "es" : "en") as "en" | "es";
    const roleTitles = ROLE_TITLE[role as BoardRoleType];
    const roleTitle = roleTitles ? roleTitles[lang] : role;
    const roleEmail = boardRole.fromEmail ?? `${role.toLowerCase().replace(/_/g, "")}@hemo-el-paso.org`;
    const contactProfile = boardRole.patient.contactProfile;
    const patientName = contactProfile
      ? `${contactProfile.firstName} ${contactProfile.lastName}`
      : boardRole.patient.email;
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/dashboard`;

    await sendEmail({
      templateType: "BOARD_ROLE_ASSIGNED",
      recipient: boardRole.patient.email,
      data: { patientName, roleTitle, roleEmail, dashboardUrl, lang },
      patientId: boardRole.patientId,
      fromEmail: "HOEP <noreply@hemo-el-paso.org>",
    });

    await prisma.boardOnboarding.upsert({
      where: { boardRoleId: boardRole.id },
      update: { emailSentAt: new Date() },
      create: { boardRoleId: boardRole.id, emailSentAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        patientId: admin!.id,
        action: AuditAction.BOARD_ROLE_ONBOARDING_SENT,
        resourceType: "BoardRole",
        resourceId: boardRole.id,
        details: `Onboarding email sent to ${boardRole.patient.email} for role ${role}`,
      },
    });
  } catch (emailError) {
    console.error("Failed to send board role onboarding email:", emailError);
    // Do not fail the API response — role assignment succeeded
  }

  return NextResponse.json({ boardRole }, { status: 201 });
}
