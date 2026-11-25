import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveRsvpToken, reissueCheckInToken } from "@/lib/rsvp";

/**
 * "Email me my QR again": re-sends the SAME QR (stored encrypted), or the virtual links for a virtual RSVP, to the
 * address on file. 60s cooldown per patient. Valid links only.
 */
export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({}));
  const ctx = await resolveRsvpToken(token);
  if (!ctx || ctx.ended || !ctx.rsvp) return NextResponse.json({ ok: false, error: "invalid_link" }, { status: 404 });
  if (!ctx.patient.email) return NextResponse.json({ ok: false, error: "no_email" }, { status: 400 });

  const recent = await prisma.emailLog.findFirst({
    where: { patientId: ctx.patient.id, templateType: { in: ["RSVP_CONFIRMATION", "RSVP_CONFIRMED_VIRTUAL"] }, sentAt: { gte: new Date(Date.now() - 60_000) } },
    select: { id: true },
  });
  if (recent) return NextResponse.json({ ok: false, error: "wait" }, { status: 429 });
  await reissueCheckInToken(ctx.rsvp.id, "confirmation");
  return NextResponse.json({ ok: true });
}
