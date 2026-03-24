"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle, Clock } from "lucide-react";

export default function VolunteerCheckinPage() {
  const params = useParams<{ slug: string; accessToken: string }>();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "already">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/events/by-slug/${params.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setEventId(data.id);
          setEventTitle(data.titleEn);
        }
      })
      .catch(() => {});
  }, [params.slug]);

  const handleCheckIn = async () => {
    if (!eventId) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/events/${eventId}/checkin/${params.accessToken}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
      } else if (res.status === 409) {
        setStatus("already");
      } else {
        setErrorMsg(data.error || "Check-in failed");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Volunteer Check-In</h1>
        {eventTitle && <p className="text-neutral-500">{eventTitle}</p>}

        {status === "idle" && (
          <button
            onClick={handleCheckIn}
            disabled={!eventId}
            className="w-full py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            Check In Now
          </button>
        )}
        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Checking in...</span>
          </div>
        )}
        {status === "success" && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-700 font-semibold">
              <CheckCircle className="w-5 h-5" />
              Checked In!
            </div>
            <p className="text-sm text-neutral-500">
              Your time has started. Remember to check out when you&apos;re done.
            </p>
            <a
              href="/portal/volunteer"
              className="block w-full py-3 rounded-full border-2 border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
            >
              Go to Volunteer Portal
            </a>
          </div>
        )}
        {status === "already" && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-amber-700 font-semibold">
              <Clock className="w-5 h-5" />
              Already Checked In
            </div>
            <a
              href="/portal/volunteer"
              className="block w-full py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
            >
              View Your Timecard
            </a>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-red-700 font-semibold">
              <XCircle className="w-5 h-5" />
              {errorMsg}
            </div>
            <button
              onClick={() => setStatus("idle")}
              className="text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
