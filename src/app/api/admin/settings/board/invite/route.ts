import { NextRequest, NextResponse } from "next/server";
import { BoardRoleType } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { assignBoardRole } from "@/lib/board/assign";
import { AuditAction } from "@prisma/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invite a board member who has no account yet.
 * Creates a Patient (role "board", no Auth0 link yet) + ContactProfile, then
 * the BoardRole. The row is linked to their Auth0 login on first sign-in
 * (see lib/board/link-session.ts).
 */
export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canAssignBoardRoles");
  if (error) return error;

  const body = await req.json();
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const { role, fromEmail } = body;

  if (!firstName || !lastName || !email || !role) {
    return NextResponse.json(
      { error: "firstName, lastName, email and role are required" },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!Object.values(BoardRoleType).includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Only reuse an existing BOARD/ADMIN row. A public patient row with the same
  // email is deliberately left alone (and never made linkable): the board
  // member gets their own row, so patient data/diagnoses stay separate.
  let patient = await prisma.patient.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      role: { in: ["board", "admin"] },
    },
    include: { contactProfile: true },
  });

  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        auth0Id: null, // linked on first login (lib/board/link-session.ts)
        email,
        role: "board",
        preferredLanguage: "en",
        source: "web",
        contactProfile: { create: { firstName, lastName } },
      },
      include: { contactProfile: true },
    });
  }

  await prisma.auditLog.create({
    data: {
      patientId: admin!.id,
      action: AuditAction.BOARD_MEMBER_INVITED,
      resourceType: "Patient",
      resourceId: patient.id,
      details: `Board member invited as ${role} by ${admin!.email}`,
    },
  });

  const result = await assignBoardRole({
    patientId: patient.id,
    role,
    fromEmail: fromEmail || null,
    admin: { id: admin!.id, email: admin!.email },
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      boardRole: result.boardRole,
      reminder:
        "Add this email to the Auth0 board allow-list (BOARD_ALLOWLIST) or they won't be able to sign in.",
    },
    { status: 201 },
  );
}
