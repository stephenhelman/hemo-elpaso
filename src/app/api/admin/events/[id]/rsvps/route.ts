import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { rsvpYes } from "@/lib/rsvp";

/** Board "Add RSVP" for phone call-ins (source "manual"). The deadline can be overridden by the board; capacity can't. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;

  const { patientId, partySize } = await req.json().catch(() => ({}));
  const p = await prisma.patient.findFirst({ where: { id: patientId, ...PATIENT_ONLY }, select: { id: true } });
  if (!p) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const r = await rsvpYes({
    eventId: params.id,
    patientId: p.id,
    partySize: Number(partySize) || 1,
    source: "manual",
    actorId: admin!.id,
    ignoreDeadline: true,
  });
  if (!r.ok) return NextResponse.json({ error: r.error, code: r.code }, { status: r.status });
  return NextResponse.json({ ok: true, rsvpId: r.rsvpId, created: r.created }, { status: 201 });
}
