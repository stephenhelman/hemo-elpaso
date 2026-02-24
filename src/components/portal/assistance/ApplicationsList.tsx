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
import { Lang } from "@/types";
import { assistanceListTranslation } from "@/translation/portalAssistance";

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
  locale: Lang;
}

export default function ApplicationsList({ applications, locale }: Props) {
  const t = assistanceListTranslation[locale];

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title={t.noApplications}
        description={t.noApplicationsDesc}
        action={{ label: t.createApplication, href: "/portal/assistance/new" }}
      />
    );
  }

  return (
    <div className="space-y-5 flex flex-col gap-1">
      {applications.map((app) => (
        <ApplicationCard key={app.id} application={app} t={t} />
      ))}
    </div>
  );
}

function ApplicationCard({
  application,
  t,
}: {
  application: Application;
  t: (typeof assistanceListTranslation)["en"];
}) {
  const statusConfig = {
    DRAFT: {
      label: t.statusLabels.DRAFT,
      color: "bg-gray-100 text-gray-800",
      icon: FileText,
    },
    SUBMITTED: {
      label: t.statusLabels.SUBMITTED,
      color: "bg-blue-100 text-blue-800",
      icon: Clock,
    },
    UNDER_REVIEW: {
      label: t.statusLabels.UNDER_REVIEW,
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock,
    },
    APPROVED: {
      label: t.statusLabels.APPROVED,
      color: "bg-green-100 text-green-800",
      icon: CheckCircle,
    },
    DENIED: {
      label: t.statusLabels.DENIED,
      color: "bg-red-100 text-red-800",
      icon: XCircle,
    },
    DISBURSED: {
      label: t.statusLabels.DISBURSED,
      color: "bg-purple-100 text-purple-800",
      icon: CheckCircle,
    },
    CLOSED: {
      label: t.statusLabels.CLOSED,
      color: "bg-gray-100 text-gray-800",
      icon: FileText,
    },
  };

  const typeLabel =
    t.typeLabels[application.assistanceType as keyof typeof t.typeLabels] ||
    application.assistanceType;

  return (
    <Link href={`/portal/assistance/${application.id}`}>
      <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-neutral-900">
                {typeLabel}
              </h3>
              <StatusBadge
                status={application.status}
                config={statusConfig}
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
                {t.approved} ${Number(application.approvedAmount).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-neutral-500">
          <div className="flex items-center gap-4">
            <span>
              {application.documents.length} {t.documents}
            </span>
            {application.disbursements.length > 0 && (
              <span>
                {application.disbursements.length} {t.disbursements}
              </span>
            )}
          </div>
          <span>
            {application.submittedAt
              ? `${t.submittedOn} ${new Date(application.submittedAt).toLocaleDateString()}`
              : `${t.createdOn} ${new Date(application.createdAt).toLocaleDateString()}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
