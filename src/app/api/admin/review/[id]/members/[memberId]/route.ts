import { NextRequest, NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { requireAnyPermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { phoneConfirmMember } from "@/lib/households/confirm";

/**
 * Confirm an adult by phone (the existing flow), open to reviewers. Body: { action: "phone_confirm", consentData: true,
 * adult: true, consentMedia?: boolean }. Nothing is returned but { ok }. The consent rows are written by phoneConfirmMember
 * exactly as for President/VP; the audit row here adds the acting reviewer (ids only).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  const { admin, error } = await requireAnyPermission(["canManageUsers", "canReviewRegistrations"]);
  if (error) return error;
  const m = await prisma.householdMember.findFirst({ where: { id: params.memberId, patientId: params.id, patient: PATIENT_ONLY }, select: { id: true, status: true } });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  if (body.action !== "phone_confirm") return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (body.consentData !== true || body.adult !== true) return NextResponse.json({ error: "invalid", field: "consent" }, { status: 400 });
  if (m.status !== "pending") return NextResponse.json({ error: "Not pending" }, { status: 409 });
  const done = await phoneConfirmMember(m.id, params.id, admin!.id, { consentMedia: body.consentMedia === true });
  if (!done) return NextResponse.json({ error: "Not pending" }, { status: 409 });
  await audit({
    actorType: "board", actorPatientId: admin!.id, action: AuditAction.PATIENT_UPDATED,
    resourceType: "HouseholdMember", resourceId: m.id, details: "Adult confirmed by phone (review)", changes: { householdId: params.id, memberId: m.id },
  });
  return NextResponse.json({ ok: true });
}
