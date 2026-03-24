"use client";

import { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";

interface Props {
  boardRoleId: string;
  fromEmail: string;
  replyTo: string;
  onClose: () => void;
}

export default function GmailComposeModal({
  boardRoleId,
  fromEmail,
  replyTo,
  onClose,
}: Props) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!to || !subject || !body) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardRoleId,
          to,
          subject,
          htmlBody: body,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? `HTTP ${res.status}`,
        );
      }

      showToast("success", "Email sent successfully.");
      setTo("");
      setSubject("");
      setBody("");
      setTimeout(onClose, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send email.";
      showToast("error", message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Compose email"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
            <h2 className="text-base font-semibold text-neutral-900">
              Compose Email
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-0">
            {/* Read-only From */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-neutral-100">
              <span className="text-xs font-medium text-neutral-500 w-16 flex-shrink-0">
                From
              </span>
              <span className="text-sm text-neutral-700 font-mono">
                {fromEmail}
              </span>
            </div>

            {/* Read-only Reply-To */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-neutral-100">
              <span className="text-xs font-medium text-neutral-500 w-16 flex-shrink-0">
                Reply-To
              </span>
              <span className="text-sm text-neutral-600">{replyTo}</span>
            </div>

            {/* To */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-neutral-100">
              <label
                htmlFor="compose-to"
                className="text-xs font-medium text-neutral-500 w-16 flex-shrink-0"
              >
                To
              </label>
              <input
                id="compose-to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
                placeholder="recipient@example.com"
                className="flex-1 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
              />
            </div>

            {/* Subject */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-neutral-100">
              <label
                htmlFor="compose-subject"
                className="text-xs font-medium text-neutral-500 w-16 flex-shrink-0"
              >
                Subject
              </label>
              <input
                id="compose-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Email subject"
                className="flex-1 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
              />
            </div>

            {/* Body */}
            <div className="px-5 py-3 border-b border-neutral-100">
              <textarea
                id="compose-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={8}
                placeholder="Write your message here… HTML is supported."
                className="w-full text-sm text-neutral-900 outline-none resize-none placeholder:text-neutral-400"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-xs text-neutral-400">
                HTML is supported in the message body.
              </p>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
