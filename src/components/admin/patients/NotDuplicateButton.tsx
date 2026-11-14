"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function NotDuplicateButton({ patientId, label }: { patientId: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      className="ml-2 text-xs font-semibold underline disabled:opacity-50"
      onClick={async () => {
        setBusy(true);
        const res = await fetch(`/api/admin/patients/${patientId}/not-duplicate`, { method: "POST" });
        setBusy(false);
        if (res.ok) router.refresh();
        else toast.error("Something went wrong.");
      }}
    >
      {label}
    </button>
  );
}
