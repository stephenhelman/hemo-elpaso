import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notifyOfficersOfAdminAction } from "@/lib/admin-notice";
import { OFFICER_ROLES, canRequireOrg, isOrgIdentity, type OfficerView } from "./rules";
import { emailDomain } from "@/lib/site";

/** "Board sign-in requires an @hemoelpaso.org account". Ships OFF. Stored in app_settings. */
export const REQUIRE_ORG_KEY = "board_requires_org_account";

export async function getRequireOrgAccount(): Promise<boolean> {
  const row = await prisma.appSetting.findUnique({ where: { key: REQUIRE_ORG_KEY }, select: { value: true } });
  const v = row?.value as { enabled?: unknown } | null | undefined;
  return v?.enabled === true;
}

/** Active officer-role holders and whether each has an org identity linked (Google Workspace, verified). */
export async function listOfficers(): Promise<(OfficerView & { name: string })[]> {
  const rows = await prisma.boardRole.findMany({
    where: { active: true, role: { in: [...OFFICER_ROLES] } },
    select: {
      role: true,
      patient: { select: { id: true, contactProfile: { select: { firstName: true, lastName: true } }, identities: { select: { provider: true, email: true, emailVerified: true } } } },
    },
  });
  const domain = emailDomain();
  return rows.map((r) => ({
    patientId: r.patient.id,
    role: r.role as OfficerView["role"],
    name: `${r.patient.contactProfile?.firstName ?? ""} ${r.patient.contactProfile?.lastName ?? ""}`.trim(),
    hasOrgIdentity: r.patient.identities.some((i) => isOrgIdentity(i, domain)),
  }));
}

export type SetRequireOrgResult =
  | { ok: true; changed: boolean; enabled: boolean; noticeSent: boolean }
  | { ok: false; error: "officers_missing"; missing: string[] };

/**
 * Turn the setting on/off. ON is refused until every officer role is held by someone with an org identity. Both
 * directions are audited (ids only) and emailed to the four officers.
 */
export async function setRequireOrgAccount(enabled: boolean, actor: { id: string; email: string }): Promise<SetRequireOrgResult> {
  const current = await getRequireOrgAccount();
  if (current === enabled) return { ok: true, changed: false, enabled, noticeSent: false };

  if (enabled) {
    const check = canRequireOrg(await listOfficers());
    if (!check.ok) return { ok: false, error: "officers_missing", missing: check.missing };
  }

  await prisma.$transaction([
    prisma.appSetting.upsert({
      where: { key: REQUIRE_ORG_KEY },
      create: { key: REQUIRE_ORG_KEY, value: { enabled }, updatedBy: actor.id },
      update: { value: { enabled }, updatedBy: actor.id },
    }),
    prisma.auditLog.create({
      data: {
        patientId: actor.id, actorType: "board", action: AuditAction.BOARD_SIGNIN_POLICY_CHANGED,
        resourceType: "AppSetting", resourceId: REQUIRE_ORG_KEY, details: enabled ? "Board sign-in requires an org account: ON" : "Board sign-in requires an org account: OFF",
        changes: { key: REQUIRE_ORG_KEY, enabled },
      },
    }),
  ]);

  const noticeSent = await notifyOfficersOfAdminAction(
    enabled
      ? {
          subjectEn: "Board sign-in now requires an HOEP account", subjectEs: "El acceso de la junta ahora requiere una cuenta de HOEP",
          linesEn: [`${actor.email} turned ON “Board sign-in requires an @${emailDomain()} account”. From now on, board access needs your HOEP Google account; a personal Gmail signs in as a family only.`],
          linesEs: [`${actor.email} activó “El acceso de la junta requiere una cuenta @${emailDomain()}”. Desde ahora, el acceso de la junta necesita su cuenta de Google de HOEP; un Gmail personal solo entra como familia.`],
        }
      : {
          subjectEn: "Board sign-in no longer requires an HOEP account", subjectEs: "El acceso de la junta ya no requiere una cuenta de HOEP",
          linesEn: [`${actor.email} turned OFF “Board sign-in requires an @${emailDomain()} account”. Officers whose existing sign-in was linked before this change can use it for board access again.`],
          linesEs: [`${actor.email} desactivó “El acceso de la junta requiere una cuenta @${emailDomain()}”. Los oficiales cuyo inicio de sesión ya estaba vinculado antes de este cambio pueden volver a usarlo para el acceso de la junta.`],
        },
  );
  return { ok: true, changed: true, enabled, noticeSent };
}
