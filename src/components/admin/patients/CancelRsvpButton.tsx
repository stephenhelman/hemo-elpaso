"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Lang } from "@/types";

const T = {
  en: { cancel: "Cancel RSVP", ask: "Cancel this RSVP? Their link and QR code stop working. No email is sent.", done: "RSVP cancelled", err: "Could not cancel" },
  es: { cancel: "Cancelar asistencia", ask: "¿Cancelar esta confirmación de asistencia? Su enlace y código QR dejan de funcionar. No se envía ningún correo.", done: "Asistencia cancelada", err: "No se pudo cancelar" },
} as const;

export default function CancelRsvpButton({ patientId, rsvpId, locale }: { patientId: string; rsvpId: string; locale: Lang }) {
  const t = T[locale];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      className="ml-2 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
      onClick={async () => {
        if (!window.confirm(t.ask)) return;
        setBusy(true);
        const res = await fetch(`/api/admin/patients/${patientId}/rsvps/${rsvpId}`, { method: "DELETE" });
        if (res.ok) { toast.success(t.done); router.refresh(); } else { toast.error(t.err); setBusy(false); }
      }}
    >
      {t.cancel}
    </button>
  );
}
