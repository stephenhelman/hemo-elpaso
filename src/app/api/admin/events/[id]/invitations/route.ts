import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/tokens";
import { currentConsents, PATIENT_ONLY } from "@/lib/patients/query";
import { emailBlocker } from "@/lib/invitations/match";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

/** Add one patient to an event's invitation list (pending). Same eligibility as auto-matching. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;

  const { patientId } = await req.json();
  const p = await prisma.patient.findFirst({
    where: { id: patientId, ...PATIENT_ONLY },
    include: { consentRecords: true },
  });
  if (!p) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const blocker = emailBlocker({
    email: p.email,
    emailOptOut: p.emailOptOut,
    consentData: currentConsents(p.consentRecords).data_and_contact,
  });
  if (blocker) {
    const msg = {
      no_consent: "This person has not consented to be contacted.",
      no_email: "This person has no email on file (use the call list).",
      opted_out: "This person opted out of email invitations.",
    }[blocker];
    return NextResponse.json({ error: msg, blocker }, { status: 400 });
  }

  const existing = await prisma.invitation.findUnique({
    where: { eventId_patientId: { eventId: params.id, patientId } },
  });
  if (existing && existing.status !== "removed") return NextResponse.json({ error: "Already on the list" }, { status: 409 });

  // A household removed earlier can be put back on purpose: same row, back to pending, and it is logged.
  const inv = existing
    ? await prisma.invitation.update({
        where: { id: existing.id },
        data: { status: "pending", removedAt: null, removedByBoardUserId: null, removalReason: null },
      })
    : await prisma.invitation.create({
        data: { eventId: params.id, patientId, tokenHash: hashToken(generateToken()), status: "pending" },
      });
  await audit({
    actorType: "board",
    actorPatientId: admin!.id,
    action: AuditAction.INVITATION_MATCHED,
    resourceType: "Invitation",
    resourceId: inv.id,
    changes: { eventId: params.id, patientId, trigger: existing ? "manual_restore" : "manual_add", triggeredByBoardUserId: admin!.id },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
