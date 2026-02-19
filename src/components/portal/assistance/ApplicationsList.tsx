"use client";

import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface Application {
  id: string;
  assistanceType: string;
  requestedAmount: number;
  approvedAmount: number | null;
  status: string;
  purpose: string;
  submittedAt: Date | null;
  createdAt: Date;
  documents: any[];
  disbursements: any[];
}

interface Props {
  applications: Application[];
}

export default function ApplicationsList({ applications }: Props) {
  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <DollarSign className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          No Applications Yet
        </h3>
        <p className="text-neutral-600 mb-6">
          Start by creating your first financial assistance application
        </p>
        <Link
          href="/portal/assistance/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
        >
          Create Application
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <ApplicationCard key={app.id} application={app} />
      ))}
    </div>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  const statusConfig = {
    DRAFT: {
      label: "Draft",
      color: "bg-gray-100 text-gray-800",
      icon: FileText,
    },
    SUBMITTED: {
      label: "Submitted",
      color: "bg-blue-100 text-blue-800",
      icon: Clock,
    },
    UNDER_REVIEW: {
      label: "Under Review",
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock,
    },
    APPROVED: {
      label: "Approved",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle,
    },
    DENIED: {
      label: "Denied",
      color: "bg-red-100 text-red-800",
      icon: XCircle,
    },
    DISBURSED: {
      label: "Disbursed",
      color: "bg-purple-100 text-purple-800",
      icon: CheckCircle,
    },
    CLOSED: {
      label: "Closed",
      color: "bg-gray-100 text-gray-800",
      icon: FileText,
    },
  }[application.status] || {
    label: application.status,
    color: "bg-gray-100 text-gray-800",
    icon: FileText,
  };

  const StatusIcon = statusConfig.icon;

  const typeLabels = {
    EVENT_FEES: "Event Fees",
    TRANSPORTATION: "Transportation",
    MEDICATION: "Medication",
    MEDICAL_EQUIPMENT: "Medical Equipment",
    EMERGENCY_SUPPORT: "Emergency Support",
    OTHER: "Other",
  };

  return (
    <Link href={`/portal/assistance/${application.id}`}>
      <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-neutral-900">
                {
                  typeLabels[
                    application.assistanceType as keyof typeof typeLabels
                  ]
                }
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}
              >
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-neutral-600 line-clamp-2">
              {application.purpose}
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-neutral-900">
              ${Number(application.requestedAmount).toFixed(2)}
            </p>
            {application.approvedAmount && (
              <p className="text-sm text-green-600 font-semibold">
                Approved: ${Number(application.approvedAmount).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-neutral-500">
          <div className="flex items-center gap-4">
            <span>{application.documents.length} documents</span>
            {application.disbursements.length > 0 && (
              <span>{application.disbursements.length} disbursements</span>
            )}
          </div>
          <span>
            {application.submittedAt
              ? `Submitted ${new Date(application.submittedAt).toLocaleDateString()}`
              : `Created ${new Date(application.createdAt).toLocaleDateString()}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
