import { mailbox, siteUrl } from "@/lib/site";
import { AuditAction, BoardRoleType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";
import { notifyOfficersOfAdminAction } from "@/lib/admin-notice";

/** The settings-only account: Patient.role "admin", or the organizational admin mailbox (admin@<mail domain>). */
export function isAdminAccount(p: { role: string; email: string | null } | null): boolean {
  if (!p) return false;
  return p.role === "admin" || (p.email ?? "").trim().toLowerCase() === mailbox("admin").toLowerCase();
}

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


export type AssignResult =
  | { ok: true; boardRole: any }
  | { ok: false; status: number; error: string };

/**
 * Create (or reactivate) a BoardRole for a patient, write the audit log and send
 * the onboarding email. Caller is responsible for authorization.
 */
export async function assignBoardRole(params: {
  patientId: string;
  role: BoardRoleType;
  fromEmail?: string | null;
  admin: { id: string; email: string };
}): Promise<AssignResult> {
  const { patientId, role, fromEmail, admin } = params;

  // The settings-only admin account (and the org admin mailbox) can never hold a board role (separation of duties).
  const target = await prisma.patient.findUnique({ where: { id: patientId }, select: { role: true, email: true } });
  if (isAdminAccount(target)) {
    return { ok: false, status: 409, error: "admin_cannot_hold_board_role" };
  }

  // Check if this patient already has this role (active)
  const existing = await prisma.boardRole.findFirst({
    where: { patientId, role, active: true },
  });

  if (existing) {
    return {
      ok: false,
      status: 409,
      error: "This patient already holds this role",
    };
  }

  // Board access is driven by Patient.role: make sure it is "board" (admins keep "admin").
  await prisma.patient.updateMany({
    where: { id: patientId, role: { notIn: ["admin", "board"] } },
    data: { role: "board" },
  });

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
          assignedBy: admin.email,
          assignedAt: new Date(),
        },
        include: { patient: { include: { contactProfile: true } } },
      })
    : await prisma.boardRole.create({
        data: {
          patientId,
          role,
          fromEmail: fromEmail || null,
          assignedBy: admin.email,
        },
        include: { patient: { include: { contactProfile: true } } },
      });

  await prisma.auditLog.create({
    data: {
      patientId: admin.id,
      action: AuditAction.BOARD_ROLE_ASSIGNED,
      resourceType: "BoardRole",
      resourceId: boardRole.id,
      details: `Role ${role} assigned to patient ${patientId} by ${admin.email}`,
    },
  });

  void notifyOfficersOfAdminAction({
    subjectEn: "Board role assigned", subjectEs: "Cargo de la junta asignado",
    linesEn: [`${admin.email} assigned the role ${role} (record ${boardRole.id}).`],
    linesEs: [`${admin.email} asignó el cargo ${role} (registro ${boardRole.id}).`],
  });

  // Part B — send onboarding email + create BoardOnboarding record
  try {
    const lang = (boardRole.patient.preferredLanguage === "es" ? "es" : "en") as "en" | "es";
    const roleTitles = ROLE_TITLE[role as BoardRoleType];
    const roleTitle = roleTitles ? roleTitles[lang] : role;
    const roleEmail = boardRole.fromEmail ?? mailbox(role.toLowerCase().replace(/_/g, ""));
    const contactProfile = boardRole.patient.contactProfile;
    const patientName = contactProfile
      ? `${contactProfile.firstName} ${contactProfile.lastName}`
      : (boardRole.patient.email ?? "");
    const dashboardUrl = `${siteUrl()}/admin/dashboard`;

    await sendEmail({
      templateType: "BOARD_ROLE_ASSIGNED",
      recipient: boardRole.patient.email,
      data: { patientName, roleTitle, roleEmail, dashboardUrl, lang },
      patientId: boardRole.patientId,
      fromEmail: `HOEP <${mailbox("noreply")}>`,
    });

    await prisma.boardOnboarding.upsert({
      where: { boardRoleId: boardRole.id },
      update: { emailSentAt: new Date() },
      create: { boardRoleId: boardRole.id, emailSentAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
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

  return { ok: true, boardRole };
}
