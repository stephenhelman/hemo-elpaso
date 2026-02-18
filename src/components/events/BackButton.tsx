"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  referrer?: string;
  lang: "en" | "es";
}

export default function BackButton({ referrer, lang }: Props) {
  const router = useRouter();

  const t = {
    en: {
      backToEvents: "Back to Events",
      backToMyEvents: "Back to My Events",
    },
    es: {
      backToEvents: "Volver a Eventos",
      backToMyEvents: "Volver a Mis Eventos",
    },
  }[lang];

  // Determine where to go back
  const getBackPath = () => {
    if (referrer === "portal") {
      return { path: "/portal/events", label: t.backToMyEvents };
    }
    return { path: "/events", label: t.backToEvents };
  };

  const { path, label } = getBackPath();

  const handleBack = (e: React.MouseEvent) => {
    // If they navigated here from within the app, use browser back
    // Otherwise, go to the determined path
    if (window.history.length > 2) {
      e.preventDefault();
      router.back();
    }
  };

  return (
    <Link
      href={path}
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-primary-300 hover:text-primary-200 transition-colors mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Link>
  );
}
