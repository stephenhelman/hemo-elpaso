import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { getAdminWithPermissions } from "@/lib/permissions";
import { loadMailingList, MAILING_PERMISSION } from "@/lib/flyers/mailing";

export const dynamic = "force-dynamic";

export default async function MailingListPage({ params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can(MAILING_PERMISSION)) redirect("/admin/dashboard");

  const list = await loadMailingList(params.id);
  if (!list) notFound();
  const en = list.rows.filter((r) => r.lang === "en").length;
  const es = list.rows.length - en;

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <Link href={`/admin/events/${list.event.id}/invitations`} className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to invitations
      </Link>
      <h1 className="text-3xl font-display font-bold text-neutral-900 mb-1">Mailing list for flyers</h1>
      <p className="text-neutral-600 mb-6">{list.event.titleEn}</p>

      <p className="mb-4 text-sm text-neutral-700">
        Approved households that were invited to this event, chose paper flyers, and have a complete mailing address.
        Each download or print is recorded in the audit log (event, count and who; no names).
      </p>
      {!list.hasFlyer && (
        <p role="alert" className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          This event has no flyer uploaded yet. Rows show each household&apos;s own language until you add one.
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <a href={`/api/admin/events/${list.event.id}/mailing-list`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-600">
          <Download className="w-4 h-4" /> Download CSV
        </a>
        <a href={`/admin/events/${list.event.id}/mailing-list/labels`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-800 text-sm font-semibold hover:bg-neutral-50">
          <Printer className="w-4 h-4" /> Print labels (Avery 5160)
        </a>
        <span className="text-sm text-neutral-600">{list.rows.length} to mail · {en} English · {es} Spanish</span>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-500 border-b border-neutral-200">
            <tr><th className="p-3">Flyer language</th><th className="p-3">Name</th><th className="p-3">Address</th></tr>
          </thead>
          <tbody>
            {list.rows.length === 0 && <tr><td colSpan={3} className="p-4 text-neutral-500">No households to mail yet.</td></tr>}
            {list.rows.map((r) => (
              <tr key={r.householdId} className="border-b border-neutral-100 last:border-0">
                <td className="p-3 font-semibold">{r.lang === "es" ? "Spanish" : "English"}</td>
                <td className="p-3">{r.name || "—"}</td>
                <td className="p-3 text-neutral-700">{[r.line1, r.line2, `${r.city}, ${r.state} ${r.zip}`].filter(Boolean).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-display font-bold text-neutral-900 mb-2">Fix address first</h2>
      <p className="mb-3 text-sm text-neutral-600">These households chose paper flyers but have no complete mailing address, so they are not in the list above.</p>
      {list.fix.length === 0 ? (
        <p className="text-sm text-neutral-500">None.</p>
      ) : (
        <ul className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
          {list.fix.map((f) => (
            <li key={f.householdId} className="p-3 flex items-center justify-between gap-3 text-sm">
              <span>{f.name || "—"}</span>
              <Link href={`/admin/patients/${f.householdId}`} className="font-semibold text-primary hover:underline">Open household</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
