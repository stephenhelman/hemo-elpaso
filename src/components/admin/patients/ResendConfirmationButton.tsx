"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ResendConfirmationButton({ patientId, label }: { patientId: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      className="font-semibold underline disabled:opacity-50"
      onClick={async () => {
        setBusy(true);
        const res = await fetch(`/api/admin/patients/${patientId}/resend-confirmation`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        if (res.ok) toast.success("Sent");
        else toast.error(`Could not send${data.error ? ` (${data.error})` : ""}`);
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
