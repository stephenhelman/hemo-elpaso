"use client";

import { Lang } from "@/types";

type StatusOption = "draft" | "pending" | "approved" | "active";

interface Props {
  status: StatusOption;
  locale: Lang;
}

export function StatusBadge({ status, locale }: Props) {
  const config = {
    draft: {
      bg: "bg-neutral-100",
      text: "text-neutral-600",
      label: { en: "Draft", es: "Borrador" },
    },
    pending: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      label: { en: "Pending Review", es: "Revisión pendiente" },
    },
    approved: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: { en: "Approved", es: "Aprobado" },
    },
    active: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      label: { en: "Live", es: "Vivir" },
    },
  }[status];

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      {config.label[locale]}
    </span>
  );
}
