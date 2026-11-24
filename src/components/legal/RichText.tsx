import Link from "next/link";
import type { ReactNode } from "react";
import { PRIVACY_EMAIL, SITE_PHONE, SITE_URL, siteHost } from "@/lib/site";
import { PLACEHOLDERS, type PlaceholderKey } from "@/content/legal/meta";
import { statusLabel, type StatusMap } from "@/content/legal/status";
import type { FeatureKey } from "@/lib/features/registry";

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\{(?:EMAIL|PHONE|HOST|BACKUP|TRANSCRIPT|ADDRESS|PROCESSOR|ASSISTANCE_RETENTION|STATUS:[a-z_]+)\})/g;
const linkClass = "text-primary-700 underline underline-offset-2 hover:text-primary-800";

/**
 * Renders the tiny inline markup used by legal text and consent text (server- and client-safe, no hooks):
 *   **bold**, [label](/internal or https://external), {EMAIL}, {PHONE}, {HOST}, the {PLACEHOLDERS} of content/legal/meta.ts, and {STATUS:key} (a feature's live label).
 * External links get class "print-url" so the printed page shows their address (see LegalDocument).
 */
export default function RichText({ text, locale, newTab = false, privacyEmail = PRIVACY_EMAIL, statuses }: { text: string; locale: "en" | "es"; newTab?: boolean; /** Live feature labels (legal pages). Without it every {STATUS:} reads "Not yet available". */ statuses?: StatusMap; /** The live privacy contact (getPrivacyEmail()); defaults to the code default. */ privacyEmail?: string }) {
  const out: ReactNode[] = [];
  text.split(TOKEN).forEach((part, i) => {
    if (!part) return;
    if (part === "{EMAIL}") {
      out.push(<a key={i} href={`mailto:${privacyEmail}`} className={linkClass}>{privacyEmail}</a>);
    } else if (part === "{PHONE}") {
      out.push(<a key={i} href={SITE_PHONE.tel} className={linkClass}>{SITE_PHONE.display}</a>);
    } else if (part === "{HOST}") {
      out.push(<span key={i}>{siteHost() || new URL(SITE_URL).host}</span>);
    } else if (part.startsWith("{STATUS:")) {
      const on = !!statuses?.[part.slice(8, -1) as FeatureKey]?.enabled;
      out.push(
        <span key={i} className={`legal-status inline-block rounded-full px-2 py-0.5 text-xs font-semibold align-middle ${on ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          {statusLabel(statuses?.[part.slice(8, -1) as FeatureKey], locale)}
        </span>,
      );
    } else if (part === "{ADDRESS}") {
      // Optional: left out of the sentence while unset.
      const v = PLACEHOLDERS.ADDRESS.value;
      if (v) out.push(<span key={i}>{v[locale]} · </span>);
    } else if (/^\{(BACKUP|TRANSCRIPT|PROCESSOR|ASSISTANCE_RETENTION)\}$/.test(part)) {
      const v = PLACEHOLDERS[part.slice(1, -1) as PlaceholderKey].value;
      out.push(<span key={i}>{v ? v[locale] : locale === "es" ? "por definir" : "to be set"}</span>);
    } else if (part.startsWith("**")) {
      out.push(<strong key={i}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("[")) {
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)!;
      const [, label, href] = m;
      out.push(
        href.startsWith("/") ? (
          <Link key={i} href={href} className={linkClass} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{label}</Link>
        ) : (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={`${linkClass} print-url`}>{label}</a>
        ),
      );
    } else {
      out.push(part);
    }
  });
  return <>{out}</>;
}
