"use client";

import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";

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
      <EmptyState
        icon={DollarSign}
        title="No Applications Yet"
        description="Start by creating your first financial assistance application"
        action={{ label: "Create Application", href: "/portal/assistance/new" }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {applications.map((app) => (
        <ApplicationCard key={app.id} application={app} />
      ))}
    </div>
  );
}

const APPLICATION_STATUS_CONFIG = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: FileText },
  SUBMITTED: { label: "Submitted", color: "bg-blue-100 text-blue-800", icon: Clock },
  UNDER_REVIEW: { label: "Under Review", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  DENIED: { label: "Denied", color: "bg-red-100 text-red-800", icon: XCircle },
  DISBURSED: { label: "Disbursed", color: "bg-purple-100 text-purple-800", icon: CheckCircle },
  CLOSED: { label: "Closed", color: "bg-gray-100 text-gray-800", icon: FileText },
};

function ApplicationCard({ application }: { application: Application }) {

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
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-neutral-900">
                {
                  typeLabels[
                    application.assistanceType as keyof typeof typeLabels
                  ]
                }
              </h3>
              <StatusBadge
                status={application.status}
                config={APPLICATION_STATUS_CONFIG}
                showIcon
              />
            </div>
            <p className="text-sm text-neutral-600 line-clamp-2">
              {application.purpose}
            </p>
          </div>

          <div className="sm:text-right">
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
