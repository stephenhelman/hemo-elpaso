import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import RepPollForm from "@/components/polls/RepPollForm";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface Props {
  params: { token: string };
}

export default async function RepPollCreationPage({ params }: Props) {
  // Get token details
  const tokenData = await prisma.pollCreationToken.findUnique({
    where: { token: params.token },
    include: {
      event: true,
    },
  });

  if (!tokenData) {
    return <InvalidToken />;
  }

  // Check if expired
  if (new Date() > tokenData.expiresAt) {
    return <ExpiredToken />;
  }

  // Get existing polls from this rep
  const existingPolls = await prisma.eventInteraction.findMany({
    where: {
      eventId: tokenData.eventId,
      createdBy: `rep:${tokenData.repEmail}`,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Create Event Polls
          </h1>
          <p className="text-neutral-600">
            for <strong>{tokenData.event.titleEn}</strong>
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Invited by HOEP • Expires {tokenData.expiresAt.toLocaleDateString()}
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Welcome, {tokenData.repName || tokenData.repEmail}!
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Create polls to engage attendees during the event</li>
            <li>• Questions should be in both English and Spanish</li>
            <li>• Your polls will be reviewed by HOEP before going live</li>
            <li>• You can create multiple polls using this link</li>
          </ul>
        </div>

        {/* Existing Polls */}
        {existingPolls.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
            <h2 className="font-semibold text-neutral-900 mb-4">
              Your Submitted Polls ({existingPolls.length})
            </h2>
            <div className="space-y-3">
              {existingPolls.map((poll) => (
                <div key={poll.id} className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">
                        {poll.titleEn}
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">
                        {(poll.options as any).options.length} options
                      </p>
                    </div>
                    <StatusBadge status={poll.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Poll Form */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
          <h2 className="font-semibold text-neutral-900 mb-6">
            {existingPolls.length > 0
              ? "Create Another Poll"
              : "Create Your First Poll"}
          </h2>
          <RepPollForm
            token={params.token}
            eventId={tokenData.eventId}
            repEmail={tokenData.repEmail}
          />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      label: "Pending Review",
    },
    approved: { bg: "bg-green-100", text: "text-green-700", label: "Approved" },
    active: { bg: "bg-blue-100", text: "text-blue-700", label: "Live" },
  }[status] || {
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    label: status,
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

function InvalidToken() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
          Invalid Link
        </h1>
        <p className="text-neutral-600">
          This poll creation link is not valid. Please contact HOEP for a new
          link.
        </p>
      </div>
    </div>
  );
}

function ExpiredToken() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
          Link Expired
        </h1>
        <p className="text-neutral-600">
          This poll creation link has expired. Please contact HOEP for a new
          link.
        </p>
      </div>
    </div>
  );
}
