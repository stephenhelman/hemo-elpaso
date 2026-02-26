"use client";
import { Lang } from "@/types";
import { XCircle } from "lucide-react";
import { pollCreationTransaltion } from "@/translation/outsideRepTranslation";

interface Props {
  locale: Lang;
}

export function InvalidToken({ locale }: Props) {
  const t = pollCreationTransaltion[locale];

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
          {t.invalidOne}
        </h1>
        <p className="text-neutral-600">{t.invalidTwo}</p>
      </div>
    </div>
  );
}
