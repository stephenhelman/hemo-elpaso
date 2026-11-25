"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Lang = "en" | "es";
const text = {
  en: { title: "Your requests to attend", status: { waiting_household_review: "Waiting while HOEP reviews your registration", pending: "Received. We'll confirm soon", waitlisted: "On the waitlist" } as Record<string, string>, withdraw: "Withdraw", failed: "That didn't work. Please try again.", view: "See event" },
  es: { title: "Sus solicitudes para asistir", status: { waiting_household_review: "En espera mientras HOEP revisa su registro", pending: "Recibida. Le confirmaremos pronto", waitlisted: "En la lista de espera" } as Record<string, string>, withdraw: "Retirar", failed: "No funcionó. Inténtelo de nuevo.", view: "Ver evento" },
};

/** The household's open requests to attend an event, each with a way to withdraw it. Titles and statuses only. */
export default function RequestList({ lang, items }: { lang: Lang; items: { id: string; slug: string; title: string; when: string; status: string }[] }) {
  const t = text[lang];
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  if (items.length === 0) return null;
  async function withdraw(id: string) {
    setBusy(id); setErr(null);
    try {
      const res = await fetch("/api/rsvp/request/withdraw", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: id }) });
      if (res.ok) router.refresh(); else setErr(t.failed);
    } catch { setErr(t.failed); } finally { setBusy(null); }
  }
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6" aria-labelledby="my-requests">
      <h2 id="my-requests" className="font-display font-semibold text-neutral-900 text-lg mb-3">{t.title}</h2>
      <ul className="divide-y divide-neutral-100">
        {items.map((r) => (
          <li key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-medium text-neutral-900">{r.title}</p><p className="text-sm text-neutral-600">{r.when}</p><p className="text-xs text-neutral-500">{t.status[r.status] ?? r.status}</p></div>
            <div className="flex items-center gap-4">
              <Link href={`/events/${r.slug}`} className="text-sm font-semibold text-primary hover:underline">{t.view}</Link>
              <button className="text-sm font-semibold text-red-700 hover:underline disabled:opacity-50" disabled={busy !== null} onClick={() => withdraw(r.id)}>{t.withdraw}</button>
            </div>
          </li>
        ))}
      </ul>
      {err && <p className="mt-2 text-sm text-red-600" role="alert">{err}</p>}
    </section>
  );
}
