import { NextRequest, NextResponse } from "next/server";
import { AuditAction, BoardRoleType } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { assignBoardRole } from "@/lib/board/assign";
import { audit } from "@/lib/audit";
import { validateOrgEmail } from "@/lib/identity/admin";

/**
 * Create a board member's record: name + org email (an @<mail domain> Google Workspace address) + role. The
 * settings-only admin never browses family records, so this refuses to reuse any record that has household data.
 * There is no allow-list to update anywhere: on their first sign-in with that Google account the verified email
 * matches this record and links itself (lib/identity/link.ts).
 */
export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canAssignBoardRoles");
  if (error) return error;

  const body = await req.json();
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const { role, fromEmail } = body;

  if (!firstName || !lastName || !body.email || !role) {
    return NextResponse.json({ error: "firstName, lastName, email and role are required" }, { status: 400 });
  }
  const v = validateOrgEmail(String(body.email));
  if (!v.ok) {
    // admin_mailbox: the organizational admin account can never be invited into a board role.
    return NextResponse.json({ error: v.error === "admin_mailbox" ? "admin_cannot_hold_board_role" : v.error }, { status: v.error === "admin_mailbox" ? 409 : 400 });
  }
  const email = v.email;
  if (!Object.values(BoardRoleType).includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Reuse a board record only if it has no household data. Anything else with this address is a family record (or
  // ambiguous): refuse, the President/VP resolves it. A second record would make the sign-in match two people.
  const existing = await prisma.patient.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, role: true, _count: { select: { householdMembers: true, consentRecords: true } }, registrationCompletedAt: true },
  });
  const withHousehold = existing.filter((p) => p.registrationCompletedAt || p._count.householdMembers > 0 || p._count.consentRecords > 0);
  if (withHousehold.length > 0 || existing.length > 1) {
    return NextResponse.json({ error: "email_in_use" }, { status: 409 });
  }

  let patientId = existing[0]?.id;
  if (!patientId) {
    const created = await prisma.patient.create({
      data: { email, role: "board", preferredLanguage: "en", source: "web", contactProfile: { create: { firstName, lastName } } },
      select: { id: true },
    });
    patientId = created.id;
    await audit({ actorType: "board", actorPatientId: admin!.id, action: AuditAction.BOARD_RECORD_CREATED, resourceType: "Patient", resourceId: patientId, details: "Board record created", changes: { patientId, role } });
  }

  const result = await assignBoardRole({ patientId, role, fromEmail: fromEmail || null, admin: { id: admin!.id, email: admin!.email } });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ boardRole: result.boardRole }, { status: 201 });
}
