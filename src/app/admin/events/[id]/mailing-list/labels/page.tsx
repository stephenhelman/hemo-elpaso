import { notFound, redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { auditMailingExport, labelLines, labelSheets, loadMailingList, MAILING_PERMISSION } from "@/lib/flyers/mailing";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Flyer labels", robots: { index: false, follow: false } };

/**
 * Print-styled label sheets, Avery 5160 (letter, 3 x 10, labels 2-5/8" x 1"). One sheet per language group, so the right
 * flyer goes in each envelope. Print at 100% / "actual size" with no margins. Opening this page counts as an export (audit row).
 */
export default async function FlyerLabelsPage({ params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can(MAILING_PERMISSION)) redirect("/admin/dashboard");

  const list = await loadMailingList(params.id);
  if (!list) notFound();
  await auditMailingExport(admin.id, list.event.id, list.rows.length, "labels");
  const sheets = labelSheets(list.rows);

  return (
    <div className="bg-neutral-100 print:bg-white min-h-screen">
      <style>{`
        @page { size: letter; margin: 0; }
        .sheet { width: 8.5in; height: 11in; padding: 0.5in 0.1875in 0; box-sizing: border-box; background: #fff; margin: 0 auto 16px; page-break-after: always; break-after: page; }
        .grid5160 { display: grid; grid-template-columns: repeat(3, 2.625in); column-gap: 0.125in; grid-auto-rows: 1in; }
        .lbl { box-sizing: border-box; height: 1in; padding: 0.12in 0.15in 0; overflow: hidden; font: 10pt/1.2 Arial, Helvetica, sans-serif; color: #000; }
        @media print { .sheet { margin: 0; } .noprint { display: none !important; } body { background: #fff; } }
      `}</style>

      <div className="noprint p-4 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold">Flyer labels: {list.event.titleEn}</h1>
        <p className="text-sm text-neutral-600 my-2">
          {list.rows.length} labels on {sheets.length} sheet{sheets.length === 1 ? "" : "s"} (Avery 5160). Each sheet is one language, so put the matching flyer in each envelope. Print at 100% (actual size).
        </p>
        <PrintButton />
        {sheets.length === 0 && <p className="mt-3 text-sm text-neutral-600">No households to mail yet.</p>}
      </div>

      {sheets.map((s, i) => (
        <section key={i} className="sheet" aria-label={`${s.lang === "es" ? "Spanish" : "English"} flyer labels, sheet ${i + 1}`}>
          <p className="noprint text-xs text-neutral-500 -mt-6 mb-1">{s.lang === "es" ? "Spanish flyer" : "English flyer"} · sheet {i + 1} of {sheets.length}</p>
          <div className="grid5160">
            {s.labels.map((r) => (
              <div key={r.householdId} className="lbl">
                {labelLines(r).map((l, k) => <div key={k} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l}</div>)}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
