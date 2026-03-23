"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  MessageSquare,
  Megaphone,
  Clock,
  Images,
  MonitorPlay,
  Copy,
  Check,
  X,
  Loader2,
  Send,
  FileText,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  eventId: string;
}

export default function EventQuickActions({ eventId }: Props) {
  const [showPresenterModal, setShowPresenterModal] = useState(false);

  return (
    <>
      <div className="mb-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <p className="text-sm font-medium text-neutral-700 mb-3">
          Live Event Management
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/events/${eventId}/itinerary`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-purple-300 hover:text-purple-600 transition-colors"
          >
            <Clock className="w-4 h-4" />
            Event Schedule
          </Link>

          <Link
            href={`/admin/events/${eventId}/announcements`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-green-300 hover:text-green-600 transition-colors"
          >
            <Megaphone className="w-4 h-4" />
            Announcements
          </Link>

          <Link
            href={`/admin/events/${eventId}/polls`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-cyan-300 hover:text-cyan-600 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Polls
          </Link>

          <Link
            href={`/admin/events/${eventId}/questions`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Q&A
          </Link>

          <Link
            href={`/admin/events/${eventId}/photos`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-emerald-300 hover:text-emerald-600 transition-colors"
          >
            <Images className="w-4 h-4" />
            Photo Gallery
          </Link>

          <button
            onClick={() => setShowPresenterModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-primary hover:text-primary transition-colors"
          >
            <MonitorPlay className="w-4 h-4" />
            Presenter Link
          </button>

          <Link
            href={`/admin/events/${eventId}/recap`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Recap
          </Link>

          <Link
            href={`/admin/events/${eventId}/sponsors`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            <Building2 className="w-4 h-4" />
            Sponsors
          </Link>
        </div>
      </div>

      {showPresenterModal && (
        <PresenterInviteModal
          eventId={eventId}
          onClose={() => setShowPresenterModal(false)}
        />
      )}
    </>
  );
}

// -------------------------------------------------------
// PresenterInviteModal
// -------------------------------------------------------
function PresenterInviteModal({
  eventId,
  onClose,
}: {
  eventId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [presenterName, setPresenterName] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(12);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events/presenter-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, presenterName, expiresInHours }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedUrl(data.presenterUrl);
        toast.success("Presenter link generated!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to generate link");
      }
    } catch {
      toast.error("Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-neutral-900">
                Presenter Access Link
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Generate a secure control panel link for your presenter
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!generatedUrl ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Presenter Name
                  <span className="text-neutral-400 font-normal ml-1">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={presenterName}
                  onChange={(e) => setPresenterName(e.target.value)}
                  placeholder="e.g. Dr. Smith"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Link expires after
                </label>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={4}>4 hours</option>
                  <option value={8}>8 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                </select>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800 font-semibold mb-1">
                  What the presenter can do:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Advance slides and control presentation</li>
                  <li>• Mark agenda items as current or completed</li>
                  <li>• Launch and stop polls</li>
                  <li>• Answer attendee questions</li>
                  <li>• Approve or reject live photos</li>
                </ul>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Generate Link
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-800 font-semibold mb-1">
                  ✓ Presenter link generated
                </p>
                <p className="text-xs text-green-700">
                  Share this link with
                  {presenterName ? ` ${presenterName}` : " your presenter"}.
                  Expires in {expiresInHours} hours.
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={generatedUrl}
                  readOnly
                  className="w-full px-4 py-2 pr-24 border border-neutral-300 rounded-lg bg-neutral-50 text-sm font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1 rounded bg-primary text-white text-xs font-semibold hover:bg-primary-600 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-neutral-500 space-y-1">
                <p>• Link works without logging in</p>
                <p>• Only one device can use it at a time</p>
                <p>• Expires after {expiresInHours} hours</p>
              </div>

              <button
                onClick={onClose}
                className="w-full px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
