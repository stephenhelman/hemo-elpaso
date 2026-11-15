"use client";

import { Analytics } from "@vercel/analytics/next";
import { sanitizeAnalyticsEvent } from "@/lib/analytics";

/**
 * Vercel Web Analytics for the PUBLIC site only (mounted in the (public) layout; the admin layout does not
 * include it). `beforeSend` must live in a client component because functions cannot be passed from a server one.
 */
export default function SiteAnalytics() {
  return <Analytics beforeSend={sanitizeAnalyticsEvent} />;
}
