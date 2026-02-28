import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
} from "lucide-react";
import { adminDiagnosisStatusTranslation } from "@/translation/adminPages";
import type { Lang } from "@/types";

interface Props {
  diagnosisLetterUrl?: string | null;
  diagnosisVerified: boolean;
  diagnosisVerifiedAt?: Date | null;
  diagnosisRejectedReason?: string | null;
  gracePeriodEndsAt?: Date | null;
  locale: Lang;
}

export default function DiagnosisVerificationStatus({
  diagnosisLetterUrl,
  diagnosisVerified,
  diagnosisVerifiedAt,
  diagnosisRejectedReason,
  gracePeriodEndsAt,
  locale,
}: Props) {
  const t = adminDiagnosisStatusTranslation[locale];

  const daysRemaining = gracePeriodEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(gracePeriodEndsAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  // Verified
  if (diagnosisVerified && diagnosisVerifiedAt) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900">{t.verified}</p>
          <p className="text-xs text-green-700">
            {new Date(diagnosisVerifiedAt).toLocaleDateString()}
          </p>
        </div>
        {diagnosisLetterUrl && (
          <a
            href={diagnosisLetterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
      </div>
    );
  }

  // Rejected
  if (diagnosisRejectedReason) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <XCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm font-medium text-red-900">{t.rejected}</p>
        </div>
        <p className="text-xs text-red-700">{diagnosisRejectedReason}</p>
      </div>
    );
  }

  // Pending
  if (diagnosisLetterUrl) {
    return (
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Clock className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">{t.pendingReview}</p>
          <p className="text-xs text-blue-700">{t.awaitingVerification}</p>
        </div>
        <a
          href={diagnosisLetterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    );
  }

  // Not uploaded
  return (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-900">{t.notUploaded}</p>
          {daysRemaining !== null && (
            <p className="text-xs text-amber-700">
              {daysRemaining === 0
                ? t.gracePeriodExpired
                : t.daysRemaining(daysRemaining)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
