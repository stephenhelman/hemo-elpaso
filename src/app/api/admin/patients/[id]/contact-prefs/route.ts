import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { setAlsoSendTo, setPhoneCanText } from "@/lib/households/contact-prefs";

/**
 * Board: change a household's contact preferences (logged with the board member's id and field names only).
 * Body: { kind: "also_send", memberIds: string[] } | { kind: "phone_text", target: "primary" | <memberId>, canText: true | false | null }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const p = await prisma.patient.findFirst({ where: { id: params.id, ...PATIENT_ONLY }, select: { id: true } });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const actor = { type: "board", patientId: admin!.id } as const;
  if (body.kind === "also_send") {
    const r = await setAlsoSendTo(p.id, body.memberIds, actor);
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error === "invalid" ? "Choose only confirmed adults who have an email." : "Not found" }, { status: r.error === "invalid" ? 400 : 404 });
  }
  if (body.kind === "phone_text") {
    const target = body.target === "primary" ? ({ kind: "primary" } as const) : typeof body.target === "string" ? ({ kind: "member", memberId: body.target } as const) : null;
    if (!target) return NextResponse.json({ error: "Bad request" }, { status: 400 });
    const r = await setPhoneCanText(p.id, target, body.canText, actor);
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error === "no_phone" ? "There is no phone number to mark." : "Could not save" }, { status: r.error === "not_found" ? 404 : 400 });
  }
  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}
