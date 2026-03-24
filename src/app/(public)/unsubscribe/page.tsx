"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "1";
  const error = searchParams.get("error");

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="font-display font-bold text-neutral-900 text-2xl mb-3">
            You&apos;ve been unsubscribed
          </h1>
          <p className="text-neutral-500 text-sm leading-relaxed mb-6">
            You will no longer receive HOEP newsletters at this email address.
            You can re-enable communications at any time from your patient portal.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/portal/profile"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
            >
              Manage Preferences
            </Link>
            <Link
              href="/"
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="font-display font-bold text-neutral-900 text-2xl mb-3">
          Unsubscribe failed
        </h1>
        <p className="text-neutral-500 text-sm leading-relaxed mb-6">
          {error === "invalid" || error === "missing"
            ? "This unsubscribe link is invalid or has expired. Please use the link from a recent newsletter email."
            : "Something went wrong. Please contact us at info@hemo-el-paso.org to be removed from our mailing list."}
        </p>
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          Return to homepage
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
