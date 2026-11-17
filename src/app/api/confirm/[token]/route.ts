import { NextRequest, NextResponse } from "next/server";
import { confirmMember, declineMember } from "@/lib/households/confirm";

/**
 * Adult household member answering for themselves via their personal link.
 * The 256-bit token IS the credential (no account). Bodies/diagnoses are never
 * logged. Invalid/expired/used tokens all answer the same 404.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  try {
    if (body.action === "decline") {
      const ok = await declineMember(params.token);
      return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, error: "invalid_token" }, { status: 404 });
    }
    if (body.action === "confirm") {
      const r = await confirmMember(params.token, body);
      if (r.ok) return NextResponse.json({ ok: true });
      if (r.field === "token") return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 404 });
      return NextResponse.json({ ok: false, error: "invalid", field: r.field }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  } catch {
    console.error("confirm: failed"); // payload has PII/PHI
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
