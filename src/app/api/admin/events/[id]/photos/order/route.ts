import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** Save the drag-to-reorder result: `ids` is the whole gallery of this event, first to last. */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission("canManageEvents");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((v: unknown): v is string => typeof v === "string") : [];
  if (ids.length === 0 || new Set(ids).size !== ids.length) return NextResponse.json({ error: "Invalid order" }, { status: 400 });

  const existing = await prisma.eventPhoto.findMany({ where: { eventId: params.id }, select: { id: true } });
  const have = new Set(existing.map((p) => p.id));
  if (ids.some((id) => !have.has(id))) return NextResponse.json({ error: "Unknown photo" }, { status: 400 });

  // Photos missing from the list (uploaded while this page was open) go after the listed ones.
  const rest = existing.map((p) => p.id).filter((id) => !ids.includes(id));
  await prisma.$transaction(
    [...ids, ...rest].map((id, i) => prisma.eventPhoto.update({ where: { id }, data: { sortOrder: i + 1 } })),
  );
  return NextResponse.json({ success: true });
}
