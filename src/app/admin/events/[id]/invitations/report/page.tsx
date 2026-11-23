import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuditAction } from "@prisma/client";
import { getAdminWithPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { SITE_TIMEZONE } from "@/lib/site";
import { buildInvitationReport, reasonLabel, triggerLabel } from "@/lib/invitations/report";

export const dynamic = "force-dynamic";

const when = (d: Date) =>
  d.toLocaleString("en-US", { timeZone: SITE_TIMEZONE, month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * Who was matched, sent and removed for one event, and by whom. President and Vice President only (canManageUsers).
 * Household NAMES are shown (they can already open the Patients directory); diagnoses never appear here.
 * Opening this page is itself logged (ids only).
 */
export default async function InvitationReportPage({ params }: { params: { id: string } }) {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canManageUsers")) redirect("/admin/dashboard");

  const event = await prisma.event.findUnique({ where: { id: params.id }, select: { id: true, titleEn: true } });
  if (!event) notFound();

  const report = await buildInvitationReport(event.id);
  await audit({
    actorType: "board",
    actorPatientId: admin.id,
    action: AuditAction.INVITATION_REPORT_VIEWED,
    resourceType: "Event",
    resourceId: event.id,
  });

  const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500";
  const Table = ({ title, note, head, children, empty }: { title: string; note?: string; head: string[]; children: React.ReactNode; empty: boolean }) => (
    <section className="mb-8">
      <h2 className="font-semibold text-neutral-900">{title}</h2>
      {note && <p className="mb-2 text-sm text-neutral-500">{note}</p>}
      <div className="mt-2 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50"><tr>{head.map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-neutral-100">
            {empty ? <tr><td colSpan={head.length} className="px-4 py-6 text-center text-neutral-400">None.</td></tr> : children}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="max-w-5xl p-4 md:p-8">
      <Link href={`/admin/events/${event.id}/invitations`} className="mb-6 inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" /> Back to Invitations
      </Link>
      <h1 className="mb-1 font-display text-3xl font-bold text-neutral-900">Invitation report</h1>
      <p className="mb-2 text-neutral-600">{event.titleEn}</p>
      <p className="mb-6 text-sm text-neutral-500">
        {report.counts.matched} matched · {report.counts.sent} sent · {report.counts.removed} removal{report.counts.removed === 1 ? "" : "s"} logged
        ({report.counts.removedStillOff} still off the list). Opening this page is recorded in the access log.
      </p>

      <Table title="Matched" note="Households added to this event's list, and what added them." head={["Household", "When", "How", "Triggered by", "Now"]} empty={report.matched.length === 0}>
        {report.matched.map((r) => (
          <tr key={r.invitationId}>
            <td className="px-4 py-3 font-medium">{r.household.name}</td>
            <td className="px-4 py-3 whitespace-nowrap">{when(r.at)}</td>
            <td className="px-4 py-3">{triggerLabel(r.trigger)}</td>
            <td className="px-4 py-3">{r.by?.name ?? "—"}</td>
            <td className="px-4 py-3">{r.status}</td>
          </tr>
        ))}
      </Table>

      <Table title="Sent" head={["Household", "Sent", "Sent by", "Now"]} empty={report.sent.length === 0}>
        {report.sent.map((r) => (
          <tr key={r.invitationId}>
            <td className="px-4 py-3 font-medium">{r.household.name}</td>
            <td className="px-4 py-3 whitespace-nowrap">{when(r.at)}</td>
            <td className="px-4 py-3">{r.by?.name ?? "—"}</td>
            <td className="px-4 py-3">{r.status}</td>
          </tr>
        ))}
      </Table>

      <Table title="Removed" note="Every manual removal, with the reason code. Households put back later are marked." head={["Household", "Removed", "Removed by", "Reason", ""]} empty={report.removed.length === 0}>
        {report.removed.map((r, i) => (
          <tr key={`${r.invitationId}-${i}`}>
            <td className="px-4 py-3 font-medium">{r.household.name}</td>
            <td className="px-4 py-3 whitespace-nowrap">{when(r.at)}</td>
            <td className="px-4 py-3">{r.by?.name ?? "—"}</td>
            <td className="px-4 py-3">{reasonLabel(r.reason)}</td>
            <td className="px-4 py-3 text-xs text-neutral-500">{r.backOnList ? "back on the list" : ""}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
