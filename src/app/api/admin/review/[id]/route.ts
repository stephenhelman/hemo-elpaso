import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/permissions";
import { setReviewStatus } from "@/lib/review/service";
import { auditReviewerView, isReviewerOnly, loadReviewerHousehold } from "@/lib/review/reviewer";

const ANY = ["canManageUsers", "canReviewRegistrations"] as const;

/** One household for review: contact details and members (names, relationship, age group). No diagnosis fields, ever. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requireAnyPermission([...ANY]);
  if (error) return error;
  const h = await loadReviewerHousehold(params.id);
  if (!h) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isReviewerOnly(admin!)) await auditReviewerView(admin!.id, "household", { householdId: h.id });
  return NextResponse.json({ household: h });
}

/** Approve, hold (with a reason code) or send back to pending. Body: { status, reason? }. The audit row holds ids, status and reason code only. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requireAnyPermission([...ANY]);
  if (error) return error;
  const b = await req.json().catch(() => ({}));
  const ok = await setReviewStatus(admin!.id, params.id, b.status, b.reason);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "invalid" }, { status: 400 });
}
