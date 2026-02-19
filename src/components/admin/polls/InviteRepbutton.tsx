"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, X, Loader2, Copy, Check } from "lucide-react";

interface Props {
  eventId: string;
}

export default function InviteRepButton({ eventId }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    repEmail: "",
    repName: "",
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/polls/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          repEmail: formData.repEmail,
          repName: formData.repName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedLink(data.link);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to generate link");
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setGeneratedLink(null);
    setFormData({ repEmail: "", repName: "" });
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary-50 transition-colors"
      >
        <Send className="w-4 h-4" />
        Invite Rep
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-neutral-900">
                  Invite Rep to Create Polls
                </h2>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!generatedLink ? (
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Rep Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.repEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, repEmail: e.target.value })
                      }
                      placeholder="rep@company.com"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Rep Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.repName}
                      onChange={(e) =>
                        setFormData({ ...formData, repName: e.target.value })
                      }
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="pt-4 border-t border-neutral-200">
                    <p className="text-sm text-neutral-600 mb-4">
                      A secure one-time link will be generated that expires in 7
                      days. The rep can create polls without logging in.
                    </p>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
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
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-semibold mb-2">
                      ✓ Magic link generated successfully!
                    </p>
                    <p className="text-xs text-green-700">
                      Share this link with {formData.repEmail}. It expires in 7
                      days.
                    </p>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="w-full px-4 py-2 pr-24 border border-neutral-300 rounded-lg bg-neutral-50 text-sm"
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
                    <p>• Link is valid for 7 days</p>
                    <p>• Rep can create multiple polls</p>
                    <p>
                      • All polls will be in "pending" status for your approval
                    </p>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
