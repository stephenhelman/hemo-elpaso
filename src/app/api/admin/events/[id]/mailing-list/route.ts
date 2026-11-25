import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { auditMailingExport, loadMailingList, mailingCsv, MAILING_PERMISSION } from "@/lib/flyers/mailing";

export const dynamic = "force-dynamic";

/** CSV of the flyer mailing list. President / VP only (canManageUsers). Each download writes one audit row (event id, count, actor). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { admin, error } = await requirePermission(MAILING_PERMISSION);
    if (error) return error;
    const list = await loadMailingList(params.id);
    if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await auditMailingExport(admin.id, params.id, list.rows.length, "csv");
    return new NextResponse(mailingCsv(list.rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="flyer-mailing-list-${list.event.id.slice(0, 8)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Flyer mailing list export error:", (e as Error)?.name);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
