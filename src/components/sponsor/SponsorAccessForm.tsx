"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  token: string;
  eventId: string;
  eventSlug: string;
  sponsorEmail: string;
  sponsorName: string | null;
  companyName: string | null;
}

export default function SponsorAccessForm({
  token,
  eventId,
  eventSlug,
  sponsorEmail,
  sponsorName,
  companyName,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAccess = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/sponsor/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          eventId,
          sponsorEmail,
          sponsorName,
          companyName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Access granted! Redirecting...");

        // ADD: Pass session token in URL
        setTimeout(() => {
          router.push(`/events/${eventSlug}/live?session=${data.sessionToken}`);
        }, 1000);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to access event");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
      <h2 className="font-semibold text-neutral-900 mb-4">Ready to Join?</h2>
      <p className="text-neutral-600 mb-6">
        Click below to access the live event dashboard where you can view and
        answer attendee questions.
      </p>

      <button
        onClick={handleAccess}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Connecting...
          </>
        ) : (
          "Access Live Event Dashboard"
        )}
      </button>
    </div>
  );
}
