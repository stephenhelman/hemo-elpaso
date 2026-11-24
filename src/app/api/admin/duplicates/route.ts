import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { listDuplicatePairs } from "@/lib/identity/duplicates";

export const dynamic = "force-dynamic";

/** President/VP (canManageUsers): candidate duplicate pairs (flagged, same email, same phone). Names, emails and phones are shown to the officer who can merge them; no diagnoses. */
export async function GET() {
  const { error } = await requirePermission("canManageUsers");
  if (error) return error;
  return NextResponse.json({ pairs: await listDuplicatePairs() });
}
