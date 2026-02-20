"use client";

import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import DiagnosisUpload from "./DiagnosisUpload";

interface Props {
  patientId: string;
  familyMemberId?: string;
  currentFileUrl?: string | null;
  diagnosisVerified: boolean;
  diagnosisVerifiedAt?: Date | null;
  diagnosisRejectedReason?: string | null;
  gracePeriodEndsAt?: Date | null;
}

export default function DiagnosisUploadSection({
  patientId,
  familyMemberId,
  currentFileUrl,
  diagnosisVerified,
  diagnosisVerifiedAt,
  diagnosisRejectedReason,
  gracePeriodEndsAt,
}: Props) {
  const router = useRouter();

  const handleUploadComplete = () => {
    router.refresh();
  };

  // Calculate days remaining in grace period
  const daysRemaining = gracePeriodEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(gracePeriodEndsAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  // Verified status
  if (diagnosisVerified && diagnosisVerifiedAt) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900 mb-1">✅ Verified</p>
              <p className="text-sm text-green-800">
                Your diagnosis letter was verified on{" "}
                {new Date(diagnosisVerifiedAt).toLocaleDateString()}
              </p>
              {currentFileUrl && (
                <a
                  href={currentFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:text-green-700 underline mt-2 inline-block"
                >
                  View uploaded letter
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rejected status
  if (diagnosisRejectedReason) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900 mb-1">❌ Not Accepted</p>
              <p className="text-sm text-red-800 mb-2">
                Your diagnosis letter was not accepted. Please upload a new one.
              </p>
              <div className="p-3 bg-white border border-red-200 rounded-lg text-sm text-red-900">
                <strong>Reason:</strong> {diagnosisRejectedReason}
              </div>
            </div>
          </div>
        </div>

        <DiagnosisUpload
          onUpload={handleUploadComplete}
          familyMemberId={familyMemberId}
          required
        />
      </div>
    );
  }

  // Pending verification status
  if (currentFileUrl) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900 mb-1">
                ⏳ Pending Review
              </p>
              <p className="text-sm text-blue-800">
                Your diagnosis letter has been uploaded and is awaiting admin
                verification.
              </p>
              <a
                href={currentFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 underline mt-2 inline-block"
              >
                View uploaded letter
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not uploaded yet - show grace period warning
  return (
    <div className="space-y-4">
      {daysRemaining !== null && (
        <div
          className={`p-4 border-2 rounded-xl ${
            daysRemaining <= 7
              ? "bg-red-50 border-red-200"
              : daysRemaining <= 30
                ? "bg-amber-50 border-amber-200"
                : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`w-6 h-6 flex-shrink-0 ${
                daysRemaining <= 7
                  ? "text-red-600"
                  : daysRemaining <= 30
                    ? "text-amber-600"
                    : "text-blue-600"
              }`}
            />
            <div>
              <p
                className={`font-semibold mb-1 ${
                  daysRemaining <= 7
                    ? "text-red-900"
                    : daysRemaining <= 30
                      ? "text-amber-900"
                      : "text-blue-900"
                }`}
              >
                {daysRemaining === 0
                  ? "⚠️ Grace Period Expired"
                  : `📅 ${daysRemaining} Days Remaining`}
              </p>
              <p
                className={`text-sm ${
                  daysRemaining <= 7
                    ? "text-red-800"
                    : daysRemaining <= 30
                      ? "text-amber-800"
                      : "text-blue-800"
                }`}
              >
                {daysRemaining === 0
                  ? "Your grace period has expired. Please upload your diagnosis letter immediately to regain access to events and financial assistance."
                  : `You have ${daysRemaining} days to upload your diagnosis letter. Without it, you won't be able to RSVP for events or apply for financial assistance.`}
              </p>
            </div>
          </div>
        </div>
      )}

      <DiagnosisUpload
        onUpload={handleUploadComplete}
        familyMemberId={familyMemberId}
        required
      />
    </div>
  );
}
