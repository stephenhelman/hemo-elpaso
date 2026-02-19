import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { ArrowLeft, Download, FileText, DollarSign } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function ApplicationDetailPage({ params }: Props) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!patient) {
    redirect("/api/auth/login");
  }

  const application = await prisma.financialAssistanceApplication.findUnique({
    where: { id: params.id },
    include: {
      documents: true,
      disbursements: true,
    },
  });

  if (!application || application.patientId !== patient.id) {
    notFound();
  }

  const statusConfig = {
    DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-800" },
    SUBMITTED: { label: "Submitted", color: "bg-blue-100 text-blue-800" },
    UNDER_REVIEW: {
      label: "Under Review",
      color: "bg-yellow-100 text-yellow-800",
    },
    APPROVED: { label: "Approved", color: "bg-green-100 text-green-800" },
    DENIED: { label: "Denied", color: "bg-red-100 text-red-800" },
    DISBURSED: { label: "Disbursed", color: "bg-purple-100 text-purple-800" },
    CLOSED: { label: "Closed", color: "bg-gray-100 text-gray-800" },
  }[application.status] || {
    label: application.status,
    color: "bg-gray-100 text-gray-800",
  };

  const typeLabels = {
    EVENT_FEES: "Event Fees",
    TRANSPORTATION: "Transportation",
    MEDICATION: "Medication",
    MEDICAL_EQUIPMENT: "Medical Equipment",
    EMERGENCY_SUPPORT: "Emergency Support",
    OTHER: "Other",
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/portal/assistance"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              {
                typeLabels[
                  application.assistanceType as keyof typeof typeLabels
                ]
              }
            </h1>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
          </div>

          {["DRAFT", "SUBMITTED"].includes(application.status) && (
            <Link
              href={`/portal/assistance/${application.id}/edit`}
              className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
            >
              Edit Application
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Details */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Application Details
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-1">
                    Amount Requested
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">
                    ${Number(application.requestedAmount).toFixed(2)}
                  </p>
                </div>

                {application.approvedAmount && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-1">
                      Amount Approved
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      ${Number(application.approvedAmount).toFixed(2)}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-1">
                    Purpose
                  </p>
                  <p className="text-neutral-900">{application.purpose}</p>
                </div>

                {application.description && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-1">
                      Additional Details
                    </p>
                    <p className="text-neutral-900">
                      {application.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-1">
                      Created
                    </p>
                    <p className="text-sm text-neutral-900">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {application.submittedAt && (
                    <div>
                      <p className="text-sm font-medium text-neutral-700 mb-1">
                        Submitted
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
                  Review Notes
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
                    Reviewed on{" "}
                    {new Date(application.reviewedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Supporting Documents */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Supporting Documents
              </h2>

              {application.documents.length === 0 ? (
                <p className="text-neutral-500 text-sm">
                  No documents uploaded
                </p>
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
                Disbursements
              </h2>

              {application.disbursements.length === 0 ? (
                <p className="text-neutral-500 text-sm">No disbursements yet</p>
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
                        <p>Method: {disbursement.paymentMethod}</p>
                        {disbursement.checkNumber && (
                          <p>Check #{disbursement.checkNumber}</p>
                        )}
                        <p>
                          Issued:{" "}
                          {new Date(
                            disbursement.issueDate,
                          ).toLocaleDateString()}
                        </p>
                        {disbursement.cashedDate && (
                          <p>
                            Cashed:{" "}
                            {new Date(
                              disbursement.cashedDate,
                            ).toLocaleDateString()}
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
