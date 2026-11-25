import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstile } from "@/lib/turnstile";
import { hashIp, MIN_RESPONSE_MS, requestRsvpLink } from "@/lib/review/access-link";

/**
 * "Enter the email you registered with" on the event page. Honeypot + Turnstile + rate limit.
 * The answer is the same {ok:true} whether the address is unknown, not approved, not invited or fine, and every answer
 * takes at least MIN_RESPONSE_MS, so neither the body nor the timing says who is registered. Only a malformed address
 * and a rate-limit hit (both depend on the caller, not on the household) answer differently.
 * The typed address is never stored or logged: the audit row has ids and an outcome code.
 */
export async function POST(req: NextRequest) {
  const started = Date.now();
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  const pad = async () => { const left = MIN_RESPONSE_MS - (Date.now() - started); if (left > 0) await new Promise((r) => setTimeout(r, left)); };

  if (typeof body.website === "string" && body.website.trim() !== "") { await pad(); return NextResponse.json({ ok: true }); }
  if (!(await verifyTurnstile(body.turnstileToken))) return NextResponse.json({ ok: false, error: "captcha" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip");
  const outcome = await requestRsvpLink({ eventId: body.eventId, email: body.email, ipHash: hashIp(ip ?? null) }).catch(() => {
    console.error("rsvp link request failed"); // no address in the log
    return "send_failed" as const;
  });
  await pad();
  if (outcome === "invalid_email") return NextResponse.json({ ok: false, error: "email" }, { status: 400 });
  if (outcome === "rate_limited") return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  return NextResponse.json({ ok: true });
}
