"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Camera,
  Users,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import QrScanner from "@/components/admin/QrScanner";
import GuestList from "@/components/admin/GuestList";
import WalkInForm from "@/components/admin/WalkInForm";
import { Lang } from "@/types";

interface Props {
  locale: Lang;
  preselectedEventId: string | null;
}

export default function AdminCheckinClient({ locale, preselectedEventId }: Props) {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(
    preselectedEventId,
  );
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventData, setSelectedEventData] = useState<any>(null);
  const [totals, setTotals] = useState<any>(null);
  const [tab, setTab] = useState<"scan" | "guests" | "walkin">("scan");

  useEffect(() => {
    // Fetch upcoming events
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.upcoming || []);

        // If preselected, find and set the event data
        if (preselectedEventId) {
          const event = data.upcoming.find(
            (e: any) => e.id === preselectedEventId,
          );
          setSelectedEventData(event);
        }

        setLoading(false);
      });
  }, [preselectedEventId]);

  useEffect(() => {
    if (!selectedEvent) return;

    // Fetch check-ins for selected event
    fetch(`/api/admin/checkin/${selectedEvent}`)
      .then((res) => res.json())
      .then((data) => {
        setCheckIns(data.checkIns || []);
        setTotals(data.totals ?? null);
      });
  }, [selectedEvent]);

  const handleScanSuccess = () => {
    // Refresh check-ins after successful scan
    if (selectedEvent) {
      fetch(`/api/admin/checkin/${selectedEvent}`)
        .then((res) => res.json())
        .then((data) => {
          setCheckIns(data.checkIns || []);
          setTotals(data.totals ?? null);
        });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500">Loading events...</p>
        </div>
      </div>
    );
  }

  // Show event selection ONLY if no event is preselected
  if (!selectedEvent) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              Event Check-In
            </h1>
            <p className="text-neutral-500">
              Select an event to start checking in attendees
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">
              Select Event
            </h2>
            {events.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                <Camera className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-400">No upcoming events</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event.id);
                      setSelectedEventData(event);
                    }}
                    className="bg-white rounded-xl border-2 border-neutral-200 p-6 text-left hover:border-primary transition-all group"
                  >
                    <h3 className="font-semibold text-neutral-900 text-lg mb-2 group-hover:text-primary transition-colors">
                      {event.titleEn}
                    </h3>
                    <p className="text-sm text-neutral-500 mb-3">
                      {new Date(event.eventDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Users className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Scanner view (when event is selected)
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Event Check-In
          </h1>
          <p className="text-neutral-500">
            Scan QR codes to check families in at the event entrance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: scan / guest list / walk-in */}
          <div className="space-y-4">
            {selectedEventData && (
              <div className="bg-primary-50 rounded-xl border border-primary-200 p-4">
                <h3 className="font-semibold text-primary-900 mb-1">{selectedEventData.titleEn}</h3>
                <p className="text-sm text-primary-700">
                  {new Date(selectedEventData.eventDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              {([["scan", "Scan QR"], ["guests", "Guest list"], ["walkin", "Walk-in"]] as const).map(([k, label]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === k ? "bg-primary text-white" : "border border-neutral-300 text-neutral-700"}`}>
                  {label}
                </button>
              ))}
            </div>
            {tab === "scan" && <QrScanner eventId={selectedEvent} onScanSuccess={handleScanSuccess} />}
            {tab === "guests" && <GuestList eventId={selectedEvent} onChange={handleScanSuccess} />}
            {tab === "walkin" && <WalkInForm eventId={selectedEvent} onDone={handleScanSuccess} />}
          </div>

          {/* Right: checked-in list */}
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-neutral-900 text-xl">Checked In ({checkIns.length})</h2>
              {totals && (
                <p className="text-sm text-neutral-500">
                  {totals.checkedInPeople} people checked in · {totals.rsvpPeople} RSVP&apos;d ({totals.rsvpParties} parties)
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 max-h-[600px] overflow-y-auto">
              {checkIns.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm">
                    No check-ins yet. Start scanning!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {checkIns.map((checkIn) => (
                    <CheckInItem key={checkIn.id} checkIn={checkIn} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckInItem({ checkIn }: { checkIn: any }) {
  const timeAgo = (date: Date) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="p-4 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900">
            {checkIn.name}
          </p>
          <p className="text-sm text-neutral-500">
            {checkIn.headcount} {checkIn.headcount === 1 ? "person" : "people"} · {timeAgo(checkIn.checkInTime)}
          </p>
        </div>
      </div>
    </div>
  );
}
