import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/permissions";
import { loadReviewQueue } from "@/lib/review/queue";
import { auditReviewerView, isReviewerOnly } from "@/lib/review/reviewer";

export const dynamic = "force-dynamic";

/**
 * Households waiting for review. canManageUsers (President/VP) or canReviewRegistrations (reviewer tier).
 * Names, emails and phones for the officer; NEVER a diagnosis field (only an "affected member listed" yes/no).
 */
export async function GET() {
  const { admin, error } = await requireAnyPermission(["canManageUsers", "canReviewRegistrations"]);
  if (error) return error;
  const rows = await loadReviewQueue();
  if (isReviewerOnly(admin!)) await auditReviewerView(admin!.id, "queue", { count: rows.length });
  return NextResponse.json({ rows, canManage: admin!.can("canManageUsers") });
}
