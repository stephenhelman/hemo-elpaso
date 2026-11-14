import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { pendingInvitationCount, sendInvitations } from "@/lib/invitations/send";

/**
 * Send all pending invitations. The client must echo the count it showed in the
 * confirmation dialog; if the list changed meanwhile we refuse rather than
 * send to people the board didn't review.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;

  const { expectedCount } = await req.json().catch(() => ({}));
  const pending = await pendingInvitationCount(params.id);
  if (pending === 0) return NextResponse.json({ error: "Nothing to send" }, { status: 400 });
  if (expectedCount !== pending) {
    return NextResponse.json({ error: "The list changed. Review it and try again.", pending }, { status: 409 });
  }
  const result = await sendInvitations(params.id, admin!.id);
  return NextResponse.json(result);
}
