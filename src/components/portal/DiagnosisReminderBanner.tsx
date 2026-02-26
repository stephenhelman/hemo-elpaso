"use client";

import { AlertCircle, Upload, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { diagnosisLetterTranslation } from "@/translation/portal";

interface Props {
  daysRemaining: number;
  hasUploadedLetter: boolean;
  isVerified: boolean;
}

export default function DiagnosisReminderBanner({
  daysRemaining,
  hasUploadedLetter,
  isVerified,
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  const { locale } = useLanguage();

  const messages = diagnosisLetterTranslation(daysRemaining);

  // Don't show if verified or dismissed
  if (isVerified || dismissed) return null;

  const content = hasUploadedLetter
    ? messages[locale].pending
    : daysRemaining > 0
      ? messages[locale].upload
      : messages[locale].expired;

  const colorClasses = hasUploadedLetter
    ? "bg-blue-50 border-blue-200 text-blue-900"
    : daysRemaining <= 7
      ? "bg-red-50 border-red-200 text-red-900"
      : "bg-amber-50 border-amber-200 text-amber-900";

  return (
    <div className={`relative border-2 rounded-xl p-4 mb-6 ${colorClasses}`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 hover:bg-black/10 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-bold mb-1">{content.title}</h3>
          <p className="text-sm mb-3">{content.description}</p>

          {!hasUploadedLetter && (
            <Link
              href="/portal/profile?tab=verification"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white font-semibold hover:bg-opacity-90 transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              {content.action}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
