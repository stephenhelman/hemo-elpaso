"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Props {
  rsvpId?: string;
  checkInId?: string;
  eventId: string;
  patientName: string;
  isCheckedIn: boolean;
}

export default function ManualCheckInButton({
  rsvpId,
  checkInId,
  eventId,
  patientName,
  isCheckedIn,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    if (!confirm(`Check in ${patientName}?`)) return;

    setLoading(true);

    try {
      const response = await fetch("/api/admin/checkin/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rsvpId,
          eventId,
        }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Check-in failed");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (
      !confirm(
        `Remove check-in for ${patientName}? This will undo the check-in.`,
      )
    )
      return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/checkin/manual?id=${checkInId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Check-out failed");
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  if (isCheckedIn) {
    return (
      <button
        onClick={handleCheckOut}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-red-600 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Removing...
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4" />
            Undo Check-In
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCheckIn}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking In...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4" />
          Check In
        </>
      )}
    </button>
  );
}
