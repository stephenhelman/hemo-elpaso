"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Newspaper,
  Plus,
  Send,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface Newsletter {
  id: string;
  month: number;
  year: number;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

interface Props {
  newsletters: Newsletter[];
  isPresident: boolean;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    icon: <Clock className="w-3 h-3" />,
  },
  PENDING_APPROVAL: {
    label: "Pending Approval",
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: <Clock className="w-3 h-3" />,
  },
  CHANGES_REQUESTED: {
    label: "Changes Requested",
    bg: "bg-red-100",
    text: "text-red-700",
    icon: <AlertCircle className="w-3 h-3" />,
  },
  APPROVED: {
    label: "Approved",
    bg: "bg-green-100",
    text: "text-green-700",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  SENT: {
    label: "Sent",
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: <Send className="w-3 h-3" />,
  },
};

export default function NewsletterIndexClient({
  newsletters,
  isPresident,
}: Props) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/admin/newsletter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          "Newsletter draft generated! The President has been notified.",
        );
        setShowGenerateForm(false);
        router.refresh();
        router.push(`/admin/newsletter/${data.newsletterId}`);
      } else if (response.status === 409) {
        toast.error(data.error);
        if (data.newsletterId) {
          router.push(`/admin/newsletter/${data.newsletterId}`);
        }
      } else {
        toast.error(data.error || "Failed to generate newsletter");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate newsletter");
    } finally {
      setGenerating(false);
    }
  };

  const years = [now.getFullYear(), now.getFullYear() - 1];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              Newsletters
            </h1>
            <p className="text-sm text-neutral-500">
              Generate, review, and send monthly newsletters to HOEP members
            </p>
          </div>
          <button
            onClick={() => setShowGenerateForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate Newsletter
          </button>
        </div>

        {/* Generate form */}
        {showGenerateForm && (
          <div className="mb-8 p-6 rounded-2xl bg-white border border-neutral-200">
            <h2 className="font-semibold text-neutral-900 mb-4">
              Generate Newsletter Draft
            </h2>
            <div className="flex items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {MONTH_NAMES.map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Newspaper className="w-4 h-4" />
                    Generate Draft
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-3">
              This will pull all items marked "Select for Newsletter" from
              events in the selected month, plus upcoming events for the Mark
              Your Calendar section.
            </p>
          </div>
        )}

        {/* Newsletter list */}
        {newsletters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <Newspaper className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 mb-2">No newsletters yet</p>
            <p className="text-sm text-neutral-400">
              Generate your first newsletter draft above
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {newsletters.map((newsletter) => {
              const s = STATUS_CONFIG[newsletter.status] || STATUS_CONFIG.DRAFT;
              return (
                <Link
                  key={newsletter.id}
                  href={`/admin/newsletter/${newsletter.id}`}
                  className="flex items-center justify-between p-5 bg-white rounded-xl border border-neutral-200 hover:border-primary hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary-50">
                      <Newspaper className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {MONTH_NAMES[newsletter.month - 1]} {newsletter.year}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {newsletter.sentAt
                          ? `Sent ${new Date(newsletter.sentAt).toLocaleDateString()}`
                          : `Created ${new Date(newsletter.createdAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}
                    >
                      {s.icon}
                      {s.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
