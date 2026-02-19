import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import SponsorAccessForm from "@/components/sponsor/SponsorAccessForm";

interface Props {
  params: { token: string };
}

export default async function SponsorAccessPage({ params }: Props) {
  const tokenData = await prisma.sponsorAccessToken.findUnique({
    where: { token: params.token },
    include: {
      event: true,
    },
  });

  if (!tokenData) {
    return <InvalidToken />;
  }

  if (new Date() > tokenData.expiresAt) {
    return <ExpiredToken />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Sponsor Access Portal
          </h1>
          <p className="text-neutral-600">
            for <strong>{tokenData.event.titleEn}</strong>
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            {new Date(tokenData.event.eventDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Welcome{tokenData.sponsorName ? `, ${tokenData.sponsorName}` : ""}!
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Answer questions from attendees in real-time</li>
            <li>• View live polls and engagement</li>
            <li>• Access expires 24 hours after the event</li>
            {tokenData.companyName && (
              <li>
                • Representing: <strong>{tokenData.companyName}</strong>
              </li>
            )}
          </ul>
        </div>

        <SponsorAccessForm
          token={params.token}
          eventId={tokenData.eventId}
          eventSlug={tokenData.event.slug}
          sponsorEmail={tokenData.sponsorEmail}
          sponsorName={tokenData.sponsorName}
          companyName={tokenData.companyName}
        />
      </div>
    </div>
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
          Invalid Access Link
        </h1>
        <p className="text-neutral-600">
          This sponsor access link is not valid. Please contact HOEP for
          assistance.
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
          Access Link Expired
        </h1>
        <p className="text-neutral-600">
          This sponsor access link has expired. Please contact HOEP if you need
          continued access.
        </p>
      </div>
    </div>
  );
}
