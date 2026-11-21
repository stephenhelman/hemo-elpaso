import { NextRequest, NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { dropMemberFromRsvps } from "@/lib/rsvp/attendees";
import { recomputeHousehold } from "@/lib/households/sync";
import { auditPatient } from "@/lib/patients/audit";
import { phoneConfirmMember, reissueMemberToken } from "@/lib/households/confirm";
import { CONSENT_TEXT_VERSION } from "@/content/consent";
import { sendMemberConfirmation } from "@/lib/households/confirmation";

type Ctx = { params: { id: string; memberId: string } };

const load = (id: string, memberId: string) =>
  prisma.householdMember.findFirst({
    where: { id: memberId, patientId: id, patient: PATIENT_ONLY },
    include: { patient: { select: { preferredLanguage: true, contactProfile: { select: { firstName: true } } } } },
  });

/**
 * Board actions on one household member. Audit entries carry ids and action
 * names only. The board never enters health information for an adult.
 *   { action: "resend" }                              new token (old one dies) + email
 *   { action: "phone_confirm", consentData: true, adult: true, consentMedia?: bool }
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;
  const m = await load(params.id, params.memberId);
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  // A confirmed adult withdraws photo consent (privacy runbook). Append-only: a NEW media record, granted = false.
  if (body.action === "withdraw_media") {
    if (m.status !== "confirmed" || m.ageGroup !== "18_plus") return NextResponse.json({ error: "Not a confirmed adult" }, { status: 409 });
    await prisma.consentRecord.create({
      data: { householdMemberId: m.id, type: "media", granted: false, textVersion: CONSENT_TEXT_VERSION, method: "phone", recordedByBoardUserId: admin!.id },
    });
    await auditPatient(admin!.id, AuditAction.PATIENT_UPDATED, params.id, `Member ${m.id} photo consent withdrawn`);
    return NextResponse.json({ ok: true });
  }

  if (m.status !== "pending") return NextResponse.json({ error: "Not pending" }, { status: 409 });

  if (body.action === "resend") {
    if (!m.email || !m.firstName) return NextResponse.json({ error: "No email on file" }, { status: 409 });
    const t = await reissueMemberToken(m.id);
    if (!t) return NextResponse.json({ error: "Could not reissue" }, { status: 409 });
    const res = await sendMemberConfirmation({
      patientId: params.id,
      email: m.email,
      firstName: m.firstName,
      primaryFirstName: m.patient.contactProfile?.firstName ?? "",
      rawToken: t.raw,
      language: m.patient.preferredLanguage === "es" ? "es" : "en",
    });
    await auditPatient(admin!.id, AuditAction.HOUSEHOLD_MEMBER_CONFIRMATION_RESENT, params.id, `Confirmation resent for member ${m.id}`);
    if (!res.ok) return NextResponse.json({ ok: false, error: res.errorName }, { status: 502 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "phone_confirm") {
    if (body.consentData !== true || body.adult !== true)
      return NextResponse.json({ error: "invalid", field: "consent" }, { status: 400 });
    const done = await phoneConfirmMember(m.id, params.id, admin!.id, { consentMedia: body.consentMedia === true });
    if (!done) return NextResponse.json({ error: "Not pending" }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "bad_request" }, { status: 400 });
}

/** Remove a member entirely (familySize drops by one; their consent records cascade). */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;
  const m = await load(params.id, params.memberId);
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await dropMemberFromRsvps(tx, m.id); // off upcoming RSVPs first (the FK would only null the link)
    await tx.householdMember.delete({ where: { id: m.id } });
    await recomputeHousehold(tx, params.id);
  });
  await auditPatient(admin!.id, AuditAction.PATIENT_UPDATED, params.id, `Household member ${m.id} removed`);
  return NextResponse.json({ ok: true });
}
