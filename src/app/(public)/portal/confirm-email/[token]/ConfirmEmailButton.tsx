"use client";

import { useState } from "react";
import Link from "next/link";
import { editText } from "@/lib/portal/edit-text";

export default function ConfirmEmailButton({ token, lang }: { token: string; lang: "en" | "es" }) {
  const t = editText[lang];
  const [state, setState] = useState<"idle" | "busy" | "done" | "bad">("idle");
  async function confirm() {
    setState("busy");
    const res = await fetch("/api/portal/confirm-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    setState(res.ok ? "done" : "bad");
  }
  if (state === "done" || state === "bad")
    return (
      <div className="space-y-3" role="status" aria-live="polite">
        <p className={state === "done" ? "text-green-700 text-sm" : "text-red-700 text-sm"}>{state === "done" ? t.confirmEmailDone : t.confirmEmailBad}</p>
        <Link href="/portal" className="text-sm text-primary font-semibold">{t.backToPortal}</Link>
      </div>
    );
  return (
    <button onClick={confirm} disabled={state === "busy"} className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold disabled:opacity-60">
      {state === "busy" ? t.saving : t.confirmEmailButton}
    </button>
  );
}
