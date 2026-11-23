import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { generateInvitations } from "@/lib/invitations/generate";

/** Re-run matching: adds NEW matches as pending. Never re-sends, never removes, never re-adds a removed household. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;
  const added = await generateInvitations(params.id, { trigger: "manual_regenerate", byBoardUserId: admin!.id });
  return NextResponse.json({ added });
}
