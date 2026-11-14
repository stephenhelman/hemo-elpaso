import { NextRequest, NextResponse } from "next/server";
import { BoardRoleType } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { assignBoardRole } from "@/lib/board/assign";
import { pendingAuth0Id } from "@/lib/board/link-session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invite a board member who has no account yet.
 * Creates a Patient (role "board", placeholder auth0Id) + ContactProfile, then
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

  let patient = await prisma.patient.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: { contactProfile: true },
  });

  if (patient) {
    // Existing row: make sure it can reach /admin. Never downgrade an admin.
    if (patient.role !== "admin" && patient.role !== "board") {
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: { role: "board" },
        include: { contactProfile: true },
      });
    }
  } else {
    patient = await prisma.patient.create({
      data: {
        auth0Id: pendingAuth0Id(),
        email,
        role: "board",
        preferredLanguage: "en",
        contactProfile: { create: { firstName, lastName } },
      },
      include: { contactProfile: true },
    });
  }

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
