/**
 * Single source for "where does this site live" and "which mailbox domain do we
 * use". Nothing else in the app should hardcode a domain.
 *
 *   NEXT_PUBLIC_BASE_URL     the site's public URL (https://hemoelpaso.org)
 *   NEXT_PUBLIC_EMAIL_DOMAIN domain of the org's mailboxes (info@, events@, ...).
 *                            Kept separate because the website can move to a new
 *                            domain before mail does. Default: hemo-el-paso.org
 *                            (the Resend-verified sending domain).
 */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function siteHost(): string {
  try {
    return new URL(siteUrl()).host;
  } catch {
    return siteUrl();
  }
}

export function emailDomain(): string {
  return process.env.NEXT_PUBLIC_EMAIL_DOMAIN || "hemo-el-paso.org";
}

export const mailbox = (local: string) => `${local}@${emailDomain()}`;
export const contactEmail = () => mailbox("info");
