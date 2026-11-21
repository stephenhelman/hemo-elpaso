import Link from "next/link";
import type { ReactNode } from "react";
import { PRIVACY_EMAIL, SITE_PHONE, SITE_URL, siteHost } from "@/lib/site";
import { BACKUP_WINDOW } from "@/content/legal/meta";

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\{(?:EMAIL|PHONE|HOST|BACKUP)\})/g;
const linkClass = "text-primary-700 underline underline-offset-2 hover:text-primary-800";

/**
 * Renders the tiny inline markup used by legal text and consent text (server- and client-safe, no hooks):
 *   **bold**, [label](/internal or https://external), {EMAIL}, {PHONE}, {HOST}, {BACKUP}.
 * External links get class "print-url" so the printed page shows their address (see LegalDocument).
 */
export default function RichText({ text, locale, newTab = false }: { text: string; locale: "en" | "es"; newTab?: boolean }) {
  const out: ReactNode[] = [];
  text.split(TOKEN).forEach((part, i) => {
    if (!part) return;
    if (part === "{EMAIL}") {
      out.push(<a key={i} href={`mailto:${PRIVACY_EMAIL}`} className={linkClass}>{PRIVACY_EMAIL}</a>);
    } else if (part === "{PHONE}") {
      out.push(<a key={i} href={SITE_PHONE.tel} className={linkClass}>{SITE_PHONE.display}</a>);
    } else if (part === "{HOST}") {
      out.push(<span key={i}>{siteHost() || new URL(SITE_URL).host}</span>);
    } else if (part === "{BACKUP}") {
      out.push(<span key={i}>{BACKUP_WINDOW[locale]}</span>);
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
