"use client";

import { AlertCircle, Upload, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface Props {
  daysRemaining: number;
  hasUploadedLetter: boolean;
  isVerified: boolean;
  language: "en" | "es";
}

export default function DiagnosisReminderBanner({
  daysRemaining,
  hasUploadedLetter,
  isVerified,
  language,
}: Props) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show if verified or dismissed
  if (isVerified || dismissed) return null;

  const messages = {
    en: {
      pending: {
        title: "Diagnosis Letter Pending Verification",
        description:
          "Your diagnosis letter has been uploaded and is awaiting admin review.",
        action: "Pending Verification",
      },
      upload: {
        title: `Upload Diagnosis Letter - ${daysRemaining} Days Remaining`,
        description:
          "Please upload your diagnosis letter to maintain access to financial assistance and event RSVPs.",
        action: "Upload Now",
      },
      expired: {
        title: "Diagnosis Letter Required",
        description:
          "Your grace period has expired. Please upload your diagnosis letter immediately to regain access.",
        action: "Upload Now",
      },
    },
    es: {
      pending: {
        title: "Carta de Diagnóstico Pendiente de Verificación",
        description:
          "Su carta de diagnóstico ha sido cargada y está esperando revisión del administrador.",
        action: "Pendiente de Verificación",
      },
      upload: {
        title: `Cargar Carta de Diagnóstico - ${daysRemaining} Días Restantes`,
        description:
          "Por favor cargue su carta de diagnóstico para mantener acceso a asistencia financiera y eventos.",
        action: "Cargar Ahora",
      },
      expired: {
        title: "Carta de Diagnóstico Requerida",
        description:
          "Su período de gracia ha expirado. Por favor cargue su carta de diagnóstico inmediatamente.",
        action: "Cargar Ahora",
      },
    },
  };

  const content = hasUploadedLetter
    ? messages[language].pending
    : daysRemaining > 0
      ? messages[language].upload
      : messages[language].expired;

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
              href="/portal/profile#diagnosis"
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
