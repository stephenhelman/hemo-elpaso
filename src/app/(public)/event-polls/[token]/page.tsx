"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { StatusBadge } from "@/components/event-polls/StatusBadge";
import { InvalidToken } from "@/components/event-polls/InvalidToken";
import { ExpiredToken } from "@/components/event-polls/ExpiredToken";
import RepPollForm from "@/components/polls/RepPollForm";
import { pollCreationTransaltion } from "@/translation/outsideRepTranslation";
import type { Lang } from "@/types";

interface TokenData {
  id: string;
  eventId: string;
  repEmail: string;
  repName: string | null;
  expiresAt: string;
  event: {
    titleEn: string;
    titleEs: string;
  };
}

interface Poll {
  id: string;
  titleEn: string;
  titleEs: string;
  status: "draft" | "pending" | "approved" | "active";
  options: { options: { id: string; text: string }[] } | null;
}

type PageStatus = "loading" | "invalid" | "expired" | "loaded";

interface Props {
  params: { token: string };
}

export default function RepPollCreationPage({ params }: Props) {
  const { locale } = useLanguage();
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [existingPolls, setExistingPolls] = useState<Poll[]>([]);

  useEffect(() => {
    async function fetchPollData() {
      try {
        const response = await fetch(
          `/api/sponsor/event-polls/${params.token}`,
        );

        if (response.status === 404) {
          setPageStatus("invalid");
          return;
        }

        if (response.status === 410) {
          setPageStatus("expired");
          return;
        }

        if (!response.ok) {
          setPageStatus("invalid");
          return;
        }

        const data = await response.json();
        setTokenData(data.tokenData);
        setExistingPolls(data.existingPolls);
        setPageStatus("loaded");
      } catch (error) {
        console.error("Failed to fetch poll data:", error);
        setPageStatus("invalid");
      }
    }

    fetchPollData();
  }, [params.token]);

  if (pageStatus === "loading") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (pageStatus === "invalid") {
    return <InvalidToken locale={locale as Lang} />;
  }

  if (pageStatus === "expired") {
    return <ExpiredToken locale={locale as Lang} />;
  }

  const data = tokenData!;
  const t = pollCreationTransaltion[locale as Lang];
  const eventTitle = locale === "es" ? data.event.titleEs : data.event.titleEn;
  const expiresFormatted = new Date(data.expiresAt).toLocaleDateString(
    locale === "es" ? "es-MX" : "en-US",
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            {t.title}
          </h1>
          <p className="text-neutral-600">
            {t.for} <strong>{eventTitle}</strong>
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            {t.invite} {expiresFormatted}
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            {t.welcome}, {data.repName || data.repEmail}!
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• {t.listItemOne}</li>
            <li>• {t.listItemTwo}</li>
            <li>• {t.listItemThree}</li>
            <li>• {t.listItemFour}</li>
          </ul>
        </div>

        {/* Existing Polls */}
        {existingPolls.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
            <h2 className="font-semibold text-neutral-900 mb-4">
              {t.submitted} ({existingPolls.length})
            </h2>
            <div className="space-y-3">
              {existingPolls.map((poll) => (
                <div key={poll.id} className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">
                        {locale === "es" ? poll.titleEs : poll.titleEn}
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">
                        {poll.options?.options?.length ?? 0} {t.options}
                      </p>
                    </div>
                    <StatusBadge status={poll.status} locale={locale as Lang} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Poll Form */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
          <h2 className="font-semibold text-neutral-900 mb-6">
            {existingPolls.length > 0 ? t.createAnother : t.createFirst}
          </h2>
          <RepPollForm
            token={params.token}
            eventId={data.eventId}
            repEmail={data.repEmail}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}
