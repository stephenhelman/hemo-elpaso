"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { adminPatientsTranslation } from "@/translation/adminPatients";
import type { Lang } from "@/types";

export default function DeletePatientPanel({ patientId, locale }: { patientId: string; locale: Lang }) {
  const t = adminPatientsTranslation[locale];
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const del = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/patients/${patientId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: text }),
      });
      if (!res.ok) throw new Error();
      toast.success(t.deleted);
      router.push("/admin/patients");
      router.refresh();
    } catch {
      toast.error(t.genericError);
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-red-200 p-6">
      <h2 className="font-semibold text-red-700 mb-1">{t.danger}</h2>
      <p className="text-sm text-neutral-600 mb-3">{t.dangerText}</p>
      <div className="flex gap-3">
        <input className="px-3 py-2 border border-neutral-300 rounded-lg text-sm" value={text}
          onChange={(e) => setText(e.target.value)} placeholder="DELETE" autoComplete="off" />
        <button onClick={del} disabled={text !== "DELETE" || busy}
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40">
          {t.deleteBtn}
        </button>
      </div>
    </div>
  );
}
