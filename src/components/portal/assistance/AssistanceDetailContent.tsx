"use client";

import { ArrowLeft, Download, FileText, DollarSign } from "lucide-react";
import Link from "next/link";
import { Lang } from "@/types";
import { assistanceDetailTranslation } from "@/translation/portalAssistance";

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  description: string | null;
  uploadedAt: Date;
}

interface Disbursement {
  id: string;
  amount: number | { toFixed: (n: number) => string };
  paymentMethod: string;
  checkNumber: string | null;
  issueDate: Date;
  cashedDate: Date | null;
  status: string;
  notes: string | null;
}

interface Application {
  id: string;
  assistanceType: string;
  status: string;
  requestedAmount: number | { toFixed: (n: number) => string };
  approvedAmount: number | { toFixed: (n: number) => string } | null;
  purpose: string;
  description: string | null;
  createdAt: Date;
  submittedAt: Date | null;
  reviewNotes: string | null;
  reviewedAt: Date | null;
  documents: Document[];
  disbursements: Disbursement[];
}

interface Props {
  application: Application;
  locale: Lang;
}

export default function AssistanceDetailContent({ application, locale }: Props) {
  const t = assistanceDetailTranslation[locale];

  const statusLabel =
    t.statusLabels[application.status as keyof typeof t.statusLabels] ||
    application.status;

  const statusColor = {
    DRAFT: "bg-gray-100 text-gray-800",
    SUBMITTED: "bg-blue-100 text-blue-800",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    DENIED: "bg-red-100 text-red-800",
    DISBURSED: "bg-purple-100 text-purple-800",
    CLOSED: "bg-gray-100 text-gray-800",
  }[application.status] || "bg-gray-100 text-gray-800";

  const typeLabel =
    t.typeLabels[application.assistanceType as keyof typeof t.typeLabels] ||
    application.assistanceType;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/portal/assistance"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              {typeLabel}
            </h1>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${statusColor}`}
            >
              {statusLabel}
            </span>
          </div>

          {["DRAFT", "SUBMITTED"].includes(application.status) && (
            <Link
              href={`/portal/assistance/${application.id}/edit`}
              className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
            >
              {t.editApplication}
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Details */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                {t.applicationDetails}
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-1">
                    {t.amountRequested}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">
                    ${Number(application.requestedAmount).toFixed(2)}
                  </p>
                </div>

                {application.approvedAmount && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-1">
                      {t.amountApproved}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      ${Number(application.approvedAmount).toFixed(2)}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-1">
                    {t.purpose}
                  </p>
                  <p className="text-neutral-900">{application.purpose}</p>
                </div>

                {application.description && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-1">
                      {t.additionalDetails}
                    </p>
                    <p className="text-neutral-900">{application.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-1">
                      {t.created}
                    </p>
                    <p className="text-sm text-neutral-900">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {application.submittedAt && (
                    <div>
                      <p className="text-sm font-medium text-neutral-700 mb-1">
                        {t.submitted}
                      </p>
                      <p className="text-sm text-neutral-900">
                        {new Date(application.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Review Notes (if reviewed) */}
            {application.reviewNotes && (
              <div
                className={`rounded-2xl border p-6 ${
                  application.status === "APPROVED"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h3
                  className={`font-semibold mb-2 ${
                    application.status === "APPROVED"
                      ? "text-green-900"
                      : "text-red-900"
                  }`}
                >
                  {t.reviewNotes}
                </h3>
                <p
                  className={`text-sm ${
                    application.status === "APPROVED"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {application.reviewNotes}
                </p>
                {application.reviewedAt && (
                  <p
                    className={`text-xs mt-2 ${
                      application.status === "APPROVED"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {t.reviewedOn}{" "}
                    {new Date(application.reviewedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Supporting Documents */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                {t.supportingDocuments}
              </h2>

              {application.documents.length === 0 ? (
                <p className="text-neutral-500 text-sm">{t.noDocuments}</p>
              ) : (
                <div className="space-y-3">
                  {application.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-neutral-400" />
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {doc.fileName}
                          </p>
                          {doc.description && (
                            <p className="text-xs text-neutral-600">
                              {doc.description}
                            </p>
                          )}
                          <p className="text-xs text-neutral-500">
                            {(doc.fileSize / 1024).toFixed(2)} KB •{" "}
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Disbursements */}
          <div>
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                {t.disbursements}
              </h2>

              {application.disbursements.length === 0 ? (
                <p className="text-neutral-500 text-sm">{t.noDisbursements}</p>
              ) : (
                <div className="space-y-3">
                  {application.disbursements.map((disbursement) => (
                    <div
                      key={disbursement.id}
                      className="p-4 border border-neutral-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            disbursement.status === "ISSUED"
                              ? "bg-green-100 text-green-800"
                              : disbursement.status === "CASHED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {disbursement.status}
                        </span>
                      </div>

                      <p className="text-xl font-bold text-neutral-900 mb-1">
                        ${Number(disbursement.amount).toFixed(2)}
                      </p>

                      <div className="text-xs text-neutral-600 space-y-1">
                        <p>
                          {t.method} {disbursement.paymentMethod}
                        </p>
                        {disbursement.checkNumber && (
                          <p>
                            {t.checkNumber}{disbursement.checkNumber}
                          </p>
                        )}
                        <p>
                          {t.issued}{" "}
                          {new Date(disbursement.issueDate).toLocaleDateString()}
                        </p>
                        {disbursement.cashedDate && (
                          <p>
                            {t.cashed}{" "}
                            {new Date(disbursement.cashedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {disbursement.notes && (
                        <p className="text-xs text-neutral-600 mt-2 pt-2 border-t border-neutral-200">
                          {disbursement.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
