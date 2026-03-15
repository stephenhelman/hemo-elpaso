"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Plus,
  Eye,
  EyeOff,
  ChevronRight,
  Loader2,
  Globe,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";

interface Minutes {
  id: string;
  title: string;
  meetingDate: string;
  isPublic: boolean;
  markedPublicAt: string | null;
  createdAt: string;
}

interface Props {
  minutes: Minutes[];
  isSecretary: boolean;
}

export default function MinutesIndexClient({ minutes, isSecretary }: Props) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleVisibility = async (
    id: string,
    currentIsPublic: boolean,
  ) => {
    if (!isSecretary) {
      toast.error("Only the Secretary can change minutes visibility");
      return;
    }
    setTogglingId(id);
    try {
      const response = await fetch(`/api/admin/minutes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !currentIsPublic }),
      });
      if (response.ok) {
        toast.success(
          currentIsPublic ? "Minutes set to private" : "Minutes published",
        );
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update visibility");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update visibility");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              Board Minutes
            </h1>
            <p className="text-sm text-neutral-500">
              Create and manage official meeting minutes
            </p>
          </div>
          <Link
            href="/admin/minutes/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Minutes
          </Link>
        </div>

        {/* List */}
        {minutes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 mb-2">No minutes yet</p>
            <p className="text-sm text-neutral-400">
              Create your first board meeting minutes above
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {minutes.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-5 bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 transition-all"
              >
                <Link
                  href={`/admin/minutes/${m.id}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div className="p-2 rounded-lg bg-neutral-50 shrink-0">
                    <FileText className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">
                      {m.title}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {new Date(m.meetingDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {/* Visibility badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      m.isPublic
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {m.isPublic ? (
                      <>
                        <Globe className="w-3 h-3" />
                        Public
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        Private
                      </>
                    )}
                  </span>

                  {/* Visibility toggle — Secretary only */}
                  {isSecretary && (
                    <button
                      onClick={() => handleToggleVisibility(m.id, m.isPublic)}
                      disabled={togglingId === m.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                        m.isPublic
                          ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {togglingId === m.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : m.isPublic ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                      {m.isPublic ? "Unpublish" : "Publish"}
                    </button>
                  )}

                  <Link href={`/admin/minutes/${m.id}`}>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
