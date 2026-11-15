import { track } from "@vercel/analytics";

/**
 * Privacy rules for Vercel Web Analytics. Everything that leaves the browser goes through
 * `sanitizeAnalyticsEvent` (the `beforeSend` hook) so a token, email or name can never reach a third party.
 *
 *  - /admin/* and /api/*: never reported.
 *  - /rsvp/<token>:       reported as /rsvp/[token].
 *  - /unsubscribe:        reported with no query string at all.
 *  - everything else:     query strings and hashes are dropped, except `lang=en|es`.
 *  - anything that still looks like it carries a token or an email is dropped as a last line of defence.
 */
export function sanitizeAnalyticsUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const path = u.pathname;

  if (/^\/(admin|api)(\/|$)/.test(path)) return null;

  let outPath = path;
  if (/^\/rsvp(\/|$)/.test(path)) outPath = "/rsvp/[token]";

  // /unsubscribe never keeps a query string (its links carry a signed token).
  const keepLang = !/^\/unsubscribe(\/|$)/.test(path);
  const lang = u.searchParams.get("lang");
  const query = keepLang && (lang === "en" || lang === "es") ? `?lang=${lang}` : "";

  const out = `${u.origin}${outPath}${query}`;
  // Last line of defence: nothing that resembles a token or an email leaves the browser.
  if (/@|%40|token/i.test(out.replace("/rsvp/[token]", "/rsvp/"))) return null;
  return out;
}

type Evt = { type: "pageview" | "event"; url: string };
export function sanitizeAnalyticsEvent<T extends Evt>(event: T): T | null {
  const url = sanitizeAnalyticsUrl(event.url);
  return url ? { ...event, url } : null;
}

/**
 * The only custom events the site may send. Names and properties are fixed here (an allow-list): no free
 * text, no ids, nothing about a person, an event or a diagnosis.
 * Custom events need a Vercel Pro or Enterprise plan, so they are OFF unless
 * NEXT_PUBLIC_ANALYTICS_CUSTOM_EVENTS=true is set (at build time).
 */
export type AnalyticsEvent =
  | { name: "register_info_submitted" }
  | { name: "rsvp_submitted"; source: "invite" | "public" }
  | { name: "language_switched"; to: "en" | "es" };

export function trackEvent(e: AnalyticsEvent): void {
  if (process.env.NEXT_PUBLIC_ANALYTICS_CUSTOM_EVENTS !== "true") return;
  try {
    if (e.name === "register_info_submitted") track(e.name);
    else if (e.name === "rsvp_submitted") track(e.name, { source: e.source });
    else if (e.name === "language_switched") track(e.name, { to: e.to });
  } catch {
    // analytics must never break the page
  }
}
