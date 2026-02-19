import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import {
  ArrowLeft,
  Download,
  FileText,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import ReviewActions from "@/components/admin/assistance/ReviewActions";
import DisbursementManager from "@/components/admin/assistance/DisbursementManager";

interface Props {
  params: { id: string };
}

export default async function AdminApplicationDetailPage({ params }: Props) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

  const application = await prisma.financialAssistanceApplication.findUnique({
    where: { id: params.id },
    include: {
      patient: {
        include: {
          profile: true,
        },
      },
      documents: true,
      disbursements: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!application) notFound();

  const disbursementsFormatted = application.disbursements.map((d) => ({
    ...d,
    amount: Number(d.amount),
  }));

  // Audit log for viewing
  await prisma.auditLog.create({
    data: {
      patientId: admin.id,
      action: "assistance_application_viewed",
      resourceType: "FinancialAssistanceApplication",
      resourceId: application.id,
      details: `Viewed assistance application for ${application.patient.profile?.firstName} ${application.patient.profile?.lastName}`,
    },
  });

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

  const canReview = ["SUBMITTED", "UNDER_REVIEW"].includes(application.status);
  const canDisburse = application.status === "APPROVED";

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Link
          href="/admin/assistance"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              Application Review
            </h1>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
          </div>

          <Link
            href={`/admin/users/${application.patientId}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
          >
            <User className="w-4 h-4" />
            View Patient Profile
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Information */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Patient Information
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-1">
                    Name
                  </p>
                  <p className="text-neutral-900">
                    {application.patient.profile?.firstName}{" "}
                    {application.patient.profile?.lastName}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-1">
                    Email
                  </p>
                  <p className="text-neutral-900">
                    {application.patient.email}
                  </p>
                </div>

                {application.patient.profile?.phone && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-1">
                      Phone
                    </p>
                    <p className="text-neutral-900">
                      {application.patient.profile.phone}
                    </p>
                  </div>
                )}

                {application.patient.profile?.city && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-1">
                      Location
                    </p>
                    <p className="text-neutral-900">
                      {application.patient.profile.city},{" "}
                      {application.patient.profile.state}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Application Details */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Application Details
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-1">
                    Type
                  </p>
                  <p className="text-neutral-900">
                    {
                      typeLabels[
                        application.assistanceType as keyof typeof typeLabels
                      ]
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-1">
                    Amount Requested
                  </p>
                  <p className="text-3xl font-bold text-neutral-900">
                    ${Number(application.requestedAmount).toFixed(2)}
                  </p>
                </div>

                {application.approvedAmount && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-1">
                      Amount Approved
                    </p>
                    <p className="text-3xl font-bold text-green-600">
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
                    <p className="text-neutral-900 whitespace-pre-wrap">
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

                  {application.reviewedAt && (
                    <div>
                      <p className="text-sm font-medium text-neutral-700 mb-1">
                        Reviewed
                      </p>
                      <p className="text-sm text-neutral-900">
                        {new Date(application.reviewedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {application.reviewedBy && (
                    <div>
                      <p className="text-sm font-medium text-neutral-700 mb-1">
                        Reviewed By
                      </p>
                      <p className="text-sm text-neutral-900">
                        {application.reviewedBy}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Review Notes */}
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
                  className={`text-sm whitespace-pre-wrap ${
                    application.status === "APPROVED"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {application.reviewNotes}
                </p>
              </div>
            )}

            {/* Supporting Documents */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Supporting Documents
              </h2>

              {application.documents.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
                  <p className="text-red-600 font-semibold">
                    No documents uploaded
                  </p>
                  <p className="text-sm text-red-500 mt-1">
                    Patient should upload supporting documents
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {application.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {doc.fileName}
                          </p>
                          {doc.description && (
                            <p className="text-xs text-neutral-600">
                              {doc.description}
                            </p>
                          )}
                          <p className="text-xs text-neutral-500">
                            {(doc.fileSize / 1024).toFixed(2)} KB • Uploaded{" "}
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-semibold"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Actions */}
            {canReview && (
              <ReviewActions
                applicationId={application.id}
                requestedAmount={Number(application.requestedAmount)}
                adminEmail={admin.email}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Disbursement Manager */}
            {canDisburse && (
              <DisbursementManager
                applicationId={application.id}
                approvedAmount={Number(application.approvedAmount || 0)}
                disbursements={disbursementsFormatted}
                adminEmail={admin.email}
              />
            )}

            {/* Disbursements History */}
            {application.disbursements.length > 0 && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                  Disbursement History
                </h2>

                <div className="space-y-3">
                  {disbursementsFormatted.map((disbursement) => (
                    <div
                      key={disbursement.id}
                      className="p-4 border border-neutral-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            disbursement.status === "ISSUED"
                              ? "bg-green-100 text-green-800"
                              : disbursement.status === "CASHED"
                                ? "bg-blue-100 text-blue-800"
                                : disbursement.status === "VOID"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {disbursement.status}
                        </span>
                      </div>

                      <p className="text-xl font-bold text-neutral-900 mb-2">
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
                        <p>By: {disbursement.issuedBy}</p>
                      </div>

                      {disbursement.notes && (
                        <p className="text-xs text-neutral-600 mt-2 pt-2 border-t border-neutral-200">
                          {disbursement.notes}
                        </p>
                      )}

                      {disbursement.proofOfPaymentUrl && (
                        <a
                          href={disbursement.proofOfPaymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                          <Download className="w-3 h-3" />
                          View Proof of Payment
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Application Timeline */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Timeline
              </h2>

              <div className="space-y-4">
                <TimelineItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Created"
                  date={application.createdAt}
                  color="gray"
                />

                {application.submittedAt && (
                  <TimelineItem
                    icon={<Calendar className="w-4 h-4" />}
                    label="Submitted"
                    date={application.submittedAt}
                    color="blue"
                  />
                )}

                {application.reviewedAt && (
                  <TimelineItem
                    icon={<Calendar className="w-4 h-4" />}
                    label="Reviewed"
                    date={application.reviewedAt}
                    color={application.status === "APPROVED" ? "green" : "red"}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  icon,
  label,
  date,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  date: Date;
  color: "gray" | "blue" | "green" | "red";
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  }[color];

  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-8 h-8 rounded-full ${colorClasses} flex items-center justify-center flex-shrink-0`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        <p className="text-xs text-neutral-600">
          {new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
