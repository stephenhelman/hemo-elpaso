import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveRsvpToken, reissueCheckInToken } from "@/lib/rsvp";

/**
 * "Email me my QR again". Raw check-in tokens aren't stored, so this mints a
 * fresh one (the previous QR/link stops working) and emails it to the address
 * on file. 60s cooldown per RSVP. Always answers {ok:true} for valid links.
 */
export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({}));
  const ctx = await resolveRsvpToken(token);
  if (!ctx || ctx.ended || !ctx.rsvp) return NextResponse.json({ ok: false, error: "invalid_link" }, { status: 404 });
  if (!ctx.patient.email) return NextResponse.json({ ok: false, error: "no_email" }, { status: 400 });

  const fresh = await prisma.rsvp.findUnique({ where: { id: ctx.rsvp.id }, select: { updatedAt: true } });
  if (fresh && Date.now() - fresh.updatedAt.getTime() < 60_000) {
    return NextResponse.json({ ok: false, error: "wait" }, { status: 429 });
  }
  await reissueCheckInToken(ctx.rsvp.id, "confirmation");
  return NextResponse.json({ ok: true });
}
