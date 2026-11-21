import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { cancelRsvp } from "@/lib/rsvp";

/**
 * Board cancels a household's upcoming RSVP on request (privacy runbook: "Stop contacting me, cancel future RSVPs
 * if they ask"). Soft cancel: the QR and link stop working, the invitation is marked declined, and an audit row is
 * written. NO cancellation email is sent: the person just asked us to stop contacting them, so the board confirms
 * back personally.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; rsvpId: string } }) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;
  const r = await prisma.rsvp.findFirst({
    where: { id: params.rsvpId, patientId: params.id, patient: PATIENT_ONLY },
    select: { id: true },
  });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const res = await cancelRsvp({ rsvpId: r.id, actorId: admin!.id, sendEmail: false });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
  return NextResponse.json({ ok: true });
}
